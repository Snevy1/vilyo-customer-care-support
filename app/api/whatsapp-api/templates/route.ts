// Updated app/api/whatsapp/templates/route.ts
import { NextResponse } from 'next/server';
import { whatsappClient } from '@/lib/whatsapp/whatsapp-client';
import { getWhatsAppTenant } from '@/lib/whatsapp/get-tenant';

export async function GET() {
  try {
    const tenant = await getWhatsAppTenant();

    // Use the WABA ID stored in your DB for this specific tenant
    if (!tenant?.whatsappBusinessId) {
      return NextResponse.json(
        { error: 'WhatsApp Business Account not linked for this tenant' },
        { status: 400 }
      );
    }

    const response = await whatsappClient.templates.list({
      businessAccountId: tenant.whatsappBusinessId, // DYNAMIC ID
      limit: 100
    });

    return NextResponse.json({
      data: response.data,
      paging: response.paging
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}