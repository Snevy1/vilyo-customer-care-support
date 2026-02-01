// lib/google-calendar.ts
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { googleCalendarConnections,organizations } from '@/db/schema';

export async function getOrgGoogleAuth(orgId: string): Promise<OAuth2Client | null> {
  try {
    // First check if organization exists
    const org = await db.select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    
    if (!org[0]) {
      console.error(`Organization ${orgId} not found`);
      return null;
    }

    // Get stored credentials with join to ensure org exists
    const connection = await db.select()
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.organization_id, orgId))
      .limit(1);
    
    if (!connection[0]) {
      console.log(`No Google Calendar connection found for org ${orgId}`);
      return null;
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );
    
    // Handle null/undefined tokens safely
    oauth2Client.setCredentials({
      access_token: connection[0].access_token || undefined,
      refresh_token: connection[0].refresh_token || undefined,
      expiry_date: connection[0].expiry_date || undefined,
      scope: connection[0].scope || undefined
    });
    
    // Check if token needs refreshing
    if (connection[0].expiry_date && Date.now() > connection[0].expiry_date - 60000) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update database with new tokens
        await db.update(googleCalendarConnections)
          .set({
            access_token: credentials.access_token || null,
            refresh_token: credentials.refresh_token || null,
            expiry_date: credentials.expiry_date || null,
            updated_at: new Date()
          })
          .where(eq(googleCalendarConnections.id, connection[0].id));
        
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        return null;
      }
    }
    
    return oauth2Client;
  } catch (error) {
    console.error('Error getting org Google auth:', error);
    return null;
  }
}

export async function checkGoogleCalendarSlot(
  auth: OAuth2Client,
  date: string,
  time: string,
  durationMinutes: number = 30
): Promise<boolean> {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        timeZone: 'Africa/Nairobi',
        items: [{ id: 'primary' }]
      }
    });
    
    const busy = response.data.calendars?.primary?.busy || [];
    return busy.length === 0;
  } catch (error) {
    console.error('Error checking calendar slot:', error);
    return false;
  }
}

export async function getAlternativeSlots(
  auth: OAuth2Client,
  date: string,
  time: string,
  durationMinutes: number = 30
): Promise<Array<{ date: string; time: string }>> {
  const alternatives: Array<{ date: string; time: string }> = [];
  const calendar = google.calendar({ version: 'v3', auth });
  
  // Check same day at different times
  const baseDate = new Date(`${date}T00:00:00`);
  const requestedTime = new Date(`${date}T${time}:00`);
  
  // Check ±1 hour, ±2 hours, next day same time
  const offsets = [-120, -90, -60, -30, 30, 60, 90, 120, 1440]; // In minutes
    
  for (const offset of offsets) {
    const slotTime = new Date(requestedTime.getTime() + offset * 60000);
    
    // Skip if slot is outside business hours (e.g., 9 AM - 5 PM)
    const hour = slotTime.getHours();
    if (hour < 9 || hour > 17) continue;
    
    const isAvailable = await checkGoogleCalendarSlot(
      auth,
      slotTime.toISOString().split('T')[0],
      slotTime.toISOString().split('T')[1].slice(0, 5),
      durationMinutes
    );
    
    if (isAvailable) {
      alternatives.push({
        date: slotTime.toISOString().split('T')[0],
        time: slotTime.toISOString().split('T')[1].slice(0, 5)
      });
    }
  }
  
  return alternatives;
}

// Type-safe event creation with proper null handling
interface GoogleEventResponse {
  id: string;
  htmlLink: string;
  hangoutLink?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  icalUID?: string;
}

// Helper function to safely extract string from Google Calendar API
function safeString(value: string | null | undefined): string | undefined {
  return value === null ? undefined : value;
}

export async function createGoogleCalendarEvent(
  auth: OAuth2Client,
  details: {
    summary: string;
    description: string;
    start: Date;
    end: Date;
    attendees: Array<{ email: string; displayName?: string }>;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    serviceType: string;
  }
): Promise<GoogleEventResponse> {
  const calendar = google.calendar({ version: 'v3', auth });
  
  try {
    const event: calendar_v3.Schema$Event = {
      summary: details.summary,
      description: details.description,
      start: {
        dateTime: details.start.toISOString(),
        timeZone: 'Africa/Nairobi'
      },
      end: {
        dateTime: details.end.toISOString(),
        timeZone: 'Africa/Nairobi'
      },
      attendees: details.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.displayName || undefined
      })),
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 } // 30 minutes before
        ]
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: false
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: event
    });
    
    // Type-safe extraction of event data with null handling
    const eventData = response.data;
    
    if (!eventData.id) {
      throw new Error('Event ID is missing from Google Calendar response');
    }
    
    // Safely extract properties with null handling
    const safeId = safeString(eventData.id);
    const safeHtmlLink = safeString(eventData.htmlLink);
    const safeHangoutLink = safeString(eventData.hangoutLink);
    const safeIcalUID = safeString(eventData.iCalUID);
    
    if (!safeId) {
      throw new Error('Event ID is missing from Google Calendar response');
    }
    
    // Safely extract start dateTime
    const safeStartDateTime = eventData.start?.dateTime 
      ? safeString(eventData.start.dateTime)
      : undefined;
    
    const safeEndDateTime = eventData.end?.dateTime
      ? safeString(eventData.end.dateTime)
      : undefined;
    
    return {
      id: safeId,
      htmlLink: safeHtmlLink || '#',
      hangoutLink: safeHangoutLink,
      start: safeStartDateTime ? { dateTime: safeStartDateTime } : undefined,
      end: safeEndDateTime ? { dateTime: safeEndDateTime } : undefined,
      icalUID: safeIcalUID
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Additional helper functions for Google Calendar
export async function listUpcomingEvents(auth: OAuth2Client, maxResults: number = 10) {
  const calendar = google.calendar({ version: 'v3', auth });
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  
  const events = response.data.items || [];
  
  // Safely map events with null handling
  return events.map(event => ({
    id: safeString(event.id),
    summary: safeString(event.summary),
    start: safeString(event.start?.dateTime || event.start?.date),
    end: safeString(event.end?.dateTime || event.end?.date),
    htmlLink: safeString(event.htmlLink),
    hangoutLink: safeString(event.hangoutLink),
    status: safeString(event.status),
  })).filter(event => event.id && event.summary); // Filter out invalid events
}

export async function deleteCalendarEvent(auth: OAuth2Client, eventId: string) {
  const calendar = google.calendar({ version: 'v3', auth });
  
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Function to test Google Calendar connection
export async function testCalendarConnection(auth: OAuth2Client): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Try to get calendar list (lightweight operation)
    const response = await calendar.calendarList.list({
      maxResults: 1,
    });
    
    const primaryCalendar = response.data.items?.[0];
    const email = primaryCalendar?.id ? safeString(primaryCalendar.id) : undefined;
    
    return {
      success: true,
      email
    };
  } catch (error) {
    console.error('Error testing calendar connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}