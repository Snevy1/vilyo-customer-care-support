import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { whatsAppTenant } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { event, data } = payload;

    // 1. Look for the phone number creation event
    if (event === 'whatsapp.phone_number.created') {
      const { 
        phone_number_id, 
        whatsapp_business_account_id, 
        external_customer_id // This is  organization_id
      } = data;

      // 2. Update  tenant record
      await db.update(whatsAppTenant)
        .set({
          whatsappPhoneNumberId: phone_number_id,
          whatsappBusinessId: whatsapp_business_account_id,
          isWhatsappConnected: true,
        })
        .where(eq(whatsAppTenant.organization_id, external_customer_id));

      console.log(`✅ Organization ${external_customer_id} successfully linked to WhatsApp ${phone_number_id}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}