// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { googleCalendarConnections,organizations } from '@/db/schema';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // 1. Get state and orgId from cookies 
    const storedState = cookieStore.get('google_auth_state')?.value;
    const storedOrgId = cookieStore.get('google_auth_org')?.value;

    if (error || !code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/error?error=oauth_denied`);
    }

    // 2. Security Check: Verify state to prevent CSRF
    if (!storedState || state !== storedState || !storedOrgId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/error?error=invalid_state`);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      
    );

    
    // 3. Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // 4. Database Upsert with Refresh Token protection
    // Google only sends refresh_token on the first connection. 
    // We update everything else, but only update refresh_token if it's provided.
    const updateData: any = {
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
      email: userInfo.data.email,
      updated_at: new Date(),
    };

    if (tokens.refresh_token) {
      updateData.refresh_token = tokens.refresh_token;
    }

const orgExists = await db.query.organizations.findFirst({
  where: eq(organizations.id, storedOrgId),
});

if (!orgExists) {
  // If it doesn't exist, we can't link a calendar. 
  // You might want to create the org here or redirect with an error.
  console.error(`Organization ${storedOrgId} not found in database.`);
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=org_not_found`);
}

    await db.insert(googleCalendarConnections)
      .values({
        organization_id: storedOrgId,
        ...updateData,
      })
      .onConflictDoUpdate({
        target: googleCalendarConnections.organization_id,
        set: updateData,
      });

    // 5. Cleanup: Remove the temporary auth cookies
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/success?success=calendar_connected`);
    response.cookies.delete('google_auth_state');
    response.cookies.delete('google_auth_org');

    return response;

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_failed`);
  }
}


