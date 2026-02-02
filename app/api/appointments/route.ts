import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { appointments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest
) {
  try {

    const cookieStore = await cookies();
                const userSession = cookieStore.get('user_session')?.value;
                
                if (!userSession) {
                  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
                }
    
    const { organization_id } = JSON.parse(userSession);

    const data = await db.select()
      .from(appointments)
      .where(eq(appointments.organization_id, organization_id))
      .orderBy(desc(appointments.scheduled_at));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}