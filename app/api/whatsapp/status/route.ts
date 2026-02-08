import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { whatsAppSubscription, whatsAppTenant } from '@/db/schema';
import { db } from '@/db/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get('organization_id');

    if (!organization_id) {
      return NextResponse.json(
        { error: 'Missing organization_id parameter' },
        { status: 400 }
      );
    }
    const [tenant] = await db.select()
      .from(whatsAppTenant)
      .where(eq(whatsAppTenant.organization_id, organization_id))
      .limit(1);


      // Fetch whatsapp subscription for the organization;

      const [subscription] = await db.select()
    .from(whatsAppSubscription)
    .where(eq(whatsAppSubscription.organization_id, organization_id))
    .limit(1);

      

    if (!tenant) {
      return NextResponse.json({
        isWhatsappConnected: false,
        kapsoCustomerId: null,
        whatsAppSubscription:null
      });
    }

    return NextResponse.json({
      isWhatsappConnected: tenant.isWhatsappConnected,
      kapsoCustomerId: tenant.kapsoCustomerId,
      name: tenant.name,
      email: tenant.email,
      whatsappSubscription: subscription || null
    });
  } catch (error) {
    console.error('Error fetching WhatsApp status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp connection status' },
      { status: 500 }
    );
  }
}