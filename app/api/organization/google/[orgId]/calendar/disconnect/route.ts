import { db } from "@/db/client";
import { googleCalendarConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = params;

    await db.delete(googleCalendarConnections)
      .where(eq(googleCalendarConnections.organization_id, orgId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}