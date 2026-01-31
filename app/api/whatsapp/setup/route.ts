import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { whatsAppTenant, whatsAppSubscription } from '@/db/schema';
import { db } from '@/db/client';

const KAPSO_API_KEY = process.env.KAPSO_API_KEY;
const PLATFORM_API_URL = 'https://api.kapso.ai/platform/v1';

const DEFAULT_SUBSCRIPTION = {
  plan_id: 'whatsapp_free_trial',
  status: 'active',
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

export async function POST(req: Request) {
  const { 
    organization_id, 
    organization_name, 
    email,
    plan_id = DEFAULT_SUBSCRIPTION.plan_id 
  } = await req.json();

  try {
    if (!organization_id || !organization_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check for existing tenant
    const [existingTenant] = await db.select()
      .from(whatsAppTenant)
      .where(eq(whatsAppTenant.organization_id, organization_id))
      .limit(1);

    let kapsoId: string;
    let internalTenantId: string;

    if (existingTenant?.kapsoCustomerId) {
      kapsoId = existingTenant.kapsoCustomerId;
      internalTenantId = existingTenant.id;
    } else {
      // 2. Create Kapso Customer if none exists
      const customerRes = await fetch(`${PLATFORM_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'X-API-Key': KAPSO_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: {
            name: organization_name,
            external_customer_id: organization_id
          }
        })
      });

      if (!customerRes.ok) throw new Error(`Kapso Customer Creation Failed`);
      const customerData = await customerRes.json();
      kapsoId = customerData.data.id;

      // 3. Insert or Update our Database
      if (existingTenant) {
        const [updated] = await db.update(whatsAppTenant)
          .set({ kapsoCustomerId: kapsoId, name: organization_name, email })
          .where(eq(whatsAppTenant.organization_id, organization_id))
          .returning();
        internalTenantId = updated.id;
      } else {
        const [inserted] = await db.insert(whatsAppTenant).values({
          name: organization_name,
          email: email,
          organization_id: organization_id,
          kapsoCustomerId: kapsoId,
          isWhatsappConnected: false,
        }).returning();
        internalTenantId = inserted.id;
      }
    }

    // 4. Ensure Subscription exists
    const [existingSub] = await db.select()
      .from(whatsAppSubscription)
      .where(eq(whatsAppSubscription.organization_id, organization_id))
      .limit(1);

    if (!existingSub) {
      await db.insert(whatsAppSubscription).values({
        tenant_id: internalTenantId,
        organization_id: organization_id,
        plan_id: plan_id,
        status: DEFAULT_SUBSCRIPTION.status,
        current_period_end: DEFAULT_SUBSCRIPTION.current_period_end,
      });
    }

    // 5. Generate Setup Link (The most important part for the user)
    const linkRes = await fetch(`${PLATFORM_API_URL}/customers/${kapsoId}/setup_links`, {
      method: 'POST',
      headers: {
        'X-API-Key': KAPSO_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        setup_link: {
          // Direct them back to your app so the UX feels seamless
      success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/whatsapp/callback?orgId=${organization_id}`,
      failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/whatsapp?state=error`
        } 
      })
    });

    const linkData = await linkRes.json();

    return NextResponse.json({ 
      url: linkData.data.url, // Send this to the frontend
      kapsoCustomerId: kapsoId,
      tenantId: internalTenantId,
      status: 'awaiting_onboarding'
    });

  } catch (error: any) {
    console.error('Setup Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}