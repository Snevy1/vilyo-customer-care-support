// lib/google-calendar.ts
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { googleCalendarConnections,organizations } from '@/db/schema';

export async function getOrgGoogleAuth(orgId: string): Promise<OAuth2Client | null> {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      with: { googleConnection: true }
    });

    // Fallback if no relation is defined:
    const connection = await db.select()
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.organization_id, orgId))
      .limit(1);

    if (!connection[0]) return null;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
      access_token: connection[0].access_token,
      refresh_token: connection[0].refresh_token,
      expiry_date: connection[0].expiry_date,
    });

    // Automatically update DB when Google refreshes the token
    oauth2Client.on('tokens', async (tokens) => {
      const updateData: any = {
        access_token: tokens.access_token,
        expiry_date: tokens.expiry_date,
        updated_at: new Date(),
      };
      
      // Only update refresh_token if Google provides a new one
      if (tokens.refresh_token) {
        updateData.refresh_token = tokens.refresh_token;
      }

      await db.update(googleCalendarConnections)
        .set(updateData)
        .where(eq(googleCalendarConnections.organization_id, orgId));
    });

    return oauth2Client;
  } catch (error) {
    console.error('Auth Retrieval Error:', error);
    return null;
  }
}



/**
 * Checks a specific slot for availability
 * Note: Added 'timezone' parameter to avoid hardcoding Nairobi
 */
export async function checkGoogleCalendarSlot(
  auth: OAuth2Client,
  date: string,
  time: string,
  timezone: string,
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
        timeZone: timezone || "Africa/Nairobi",
        items: [{ id: 'primary' }]
      }
    });

    const busy = response.data.calendars?.primary?.busy || [];
    return busy.length === 0;
  } catch (error) {
    console.error('Availability Check Error:', error);
    return false;
  }
}

/**
 
 * Fetches free/busy for the whole day in ONE call to prevent rate limits.
 */
export async function getAlternativeSlots(
  auth: OAuth2Client,
  date: string,
  timezone: string,
  durationMinutes: number = 30
): Promise<Array<{ date: string; time: string }>> {
  const calendar = google.calendar({ version: 'v3', auth });
  const startOfDay = new Date(`${date}T00:00:00Z`);
  const endOfDay = new Date(`${date}T23:59:59Z`);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      timeZone: timezone,
      items: [{ id: 'primary' }]
    }
  });

  const busySlots = response.data.calendars?.primary?.busy || [];
  const alternatives: Array<{ date: string; time: string }> = [];
  
  // Logic: Check every hour from 9 AM to 5 PM
  for (let hour = 9; hour <= 17; hour++) {
    const candidate = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00`);
    const candidateEnd = new Date(candidate.getTime() + durationMinutes * 60000);

    // Check if candidate overlaps with any busy slot
    const isBusy = busySlots.some(busy => {
      const bStart = new Date(busy.start!);
      const bEnd = new Date(busy.end!);
      return (candidate < bEnd && candidateEnd > bStart);
    });

    if (!isBusy) {
      alternatives.push({ 
        date, 
        time: `${hour.toString().padStart(2, '0')}:00` 
      });
    }
    if (alternatives.length >= 3) break;
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

/**
 * Creates the Google Calendar Event with Meet Link
 */
export async function createGoogleCalendarEvent(
  auth: OAuth2Client,
  timezone: string,
  details: {
    summary: string;
    description: string;
    start: Date;
    end: Date;
    attendees: Array<{ email: string; displayName?: string }>;
  }
) {
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: details.summary,
      description: details.description,
      start: { dateTime: details.start.toISOString(), timeZone: timezone },
      end: { dateTime: details.end.toISOString(), timeZone: timezone },
      attendees: details.attendees,
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'email', minutes: 1440 }, { method: 'popup', minutes: 30 }]
      }
    }
  });

  return response.data;
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