// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { googleCalendarConnections } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_denied`
      );
    }

    // Verify state parameter
    const storedState = sessionStorage.getItem('google_auth_state');
    const storedOrgId = sessionStorage.getItem('google_auth_org');
    
    if (!storedState || !storedOrgId || state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`
      );
    }

    // Clear stored values
    sessionStorage.removeItem('google_auth_state');
    sessionStorage.removeItem('google_auth_org');

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    // Store tokens in database
    await db.insert(googleCalendarConnections).values({
      organization_id: storedOrgId,
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope!,
      email: userInfo.data.email,
      created_at: new Date(),
      updated_at: new Date()
    }).onConflictDoUpdate({
      target: googleCalendarConnections.organization_id,
      set: {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        scope: tokens.scope!,
        email: userInfo.data.email,
        updated_at: new Date()
      }
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=calendar_connected`
    );
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_failed`
    );
  }
}