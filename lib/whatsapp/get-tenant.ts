
import { cookies } from 'next/headers';
import { whatsAppTenant } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db/client';

export async function getWhatsAppTenant() {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) return null;

    const { email } = JSON.parse(userSession);

    const [tenant] = await db
      .select()
      .from(whatsAppTenant)
      .where(eq(whatsAppTenant.email, email))
      .limit(1);

    return tenant ?? null;
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return null;
  }
}