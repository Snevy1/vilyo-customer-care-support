import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { organizations, googleCalendarConnections } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PATCH: Update Organization Timezone
export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { timezone } = await req.json();
    const { orgId } = params;

    await db.update(organizations)
      .set({ timezone, updated_at: new Date() })
      .where(eq(organizations.id, orgId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update timezone" }, { status: 500 });
  }
}

// DELETE: Disconnect Google Calendar
export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = params;

    // Remove the connection from the DB
    // Because of  'cascade' onDelete, this is safe.
    await db.delete(googleCalendarConnections)
      .where(eq(googleCalendarConnections.organization_id, orgId));

    return NextResponse.json({ success: true, message: "Calendar disconnected" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}