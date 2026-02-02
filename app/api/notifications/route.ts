import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { notificationSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { z } from 'zod';

const webhookSchema = z.string().url().optional().or(z.literal(''))

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
                        const userSession = cookieStore.get('user_session')?.value;
                        
                        if (!userSession) {
                          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
                        }
            
            const { organization_id } = JSON.parse(userSession);

            const settings = await db.query.notificationSettings.findFirst({
    where: eq(notificationSettings.organization_id,organization_id),
  });
  return NextResponse.json(settings || { email_enabled: true, sms_enabled: false });
        
        
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
        
    }
  
}

export async function PATCH(req: NextRequest, { params }: { params: { orgId: string } }) {
  try {

    const cookieStore = await cookies();
                        const userSession = cookieStore.get('user_session')?.value;
                        
                        if (!userSession) {
                          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
                        }
            
            const { organization_id } = JSON.parse(userSession);

   const body = await req.json();

   if (body.webhook_url && body.webhook_url.trim() !== '') {
      const result = webhookSchema.safeParse(body.webhook_url);
      if (!result.success) {
        return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
      }
    }
  
  // This saves the checkboxes (email_enabled, sms_enabled) 
  // and the specific contact info (notification_phone)
  await db.insert(notificationSettings)
    .values({ 
      organization_id: organization_id, 
      ...body 
    })
    .onConflictDoUpdate({
      target: notificationSettings.organization_id,
      set: { ...body, updated_at: new Date() }
    });

  return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    
  }
}