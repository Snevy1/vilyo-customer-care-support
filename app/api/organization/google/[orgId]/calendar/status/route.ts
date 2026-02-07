import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { googleCalendarConnections } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } =  await params;

    const connection = await db.query.googleCalendarConnections.findFirst({
      where: eq(googleCalendarConnections.organization_id, orgId),
    });

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    // Pro Check: Is the token expired? 
    // Even if it is, we are 'connected' because we have a refresh_token.
    // We only return connected: false if the record is missing.
    return NextResponse.json({ 
      connected: true, 
      email: connection.email,
      lastUpdated: connection.updated_at 
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ connected: false, error: "Internal error" }, { status: 500 });
  }
}