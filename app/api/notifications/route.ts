import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { notifications, notificationSettings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';

// --- FETCH ACTIVITY FEED ---
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { organization_id } = JSON.parse(userSession);

    // Fetch latest 50 notifications for the feed
    const activityFeed = await db
      .select()
      .from(notifications)
      .where(eq(notifications.organization_id, organization_id))
      .orderBy(desc(notifications.created_at))
      .limit(50);

    // Also fetch settings for the toggle states in UI
    const settings = await db.query.notificationSettings.findFirst({
      where: eq(notificationSettings.organization_id, organization_id),
    });

    return NextResponse.json({
      feed: activityFeed,
      settings: settings || { email_enabled: true, sms_enabled: false }
    });
  } catch (error) {
    console.error("Fetch Notifications Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- MARK ALL AS READ ---
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { organization_id } = JSON.parse(userSession);

    await db
      .update(notifications)
      .set({ is_read: true })
      .where(eq(notifications.organization_id, organization_id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}