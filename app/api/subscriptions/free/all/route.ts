// This route handles all free tiers for web_chat, whatsapp and crm


import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db/client';
import { organizations, whatsAppSubscription, crmSubscription } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions/subscriptions'; 

export async function POST(request: NextRequest) {
  try {
    // ---------------- AUTH ----------------
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;

    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, user_id } = JSON.parse(userSession);

    // ---------------- BODY ----------------
    const body = await request.json();
    const { organizationId, productType, planTier, tenantId } = body;

    // Verify organization matches session
    if (organizationId !== organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify it's a free plan
    if (planTier !== 'free') {
      return NextResponse.json(
        { error: 'This endpoint only handles free plans' },
        { status: 400 }
      );
    }

    // ---------------- ACTIVATE FREE PLAN ----------------
    let result;

    switch (productType) {
      case 'web_chat':
        result = await db
          .update(organizations)
          .set({
            web_chat_plan: 'free',
            web_chat_subscription_id: null, // Free plans don't have subscription IDs
            web_chat_provider: 'free',
            web_chat_status: 'active',
            web_chat_period_end: null, // Free plans don't expire
            web_chat_created_at: new Date(),
            web_chat_updated_at: new Date(),
          })
          .where(eq(organizations.id, organizationId))
          .returning();
        break;

      case 'whatsapp':
        result = await db
          .insert(whatsAppSubscription)
          .values({
            tenant_id: tenantId!,
            organization_id: organizationId,
            status: 'active',
            plan_tier: 'free',
            plan_id: 'free',
            subscription_id: null,
            provider: 'free',
            current_period_end: sql`'infinity'`,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning();
        break;

      case 'crm':
        const freePlan = SUBSCRIPTION_PLANS.crm.free;
        result = await db
          .insert(crmSubscription)
          .values({
            organization_id: organizationId,
            status: 'active',
            plan_tier: 'free',
            plan_id: null,
            subscription_id: null,
            provider: 'free',
            max_contacts: freePlan?.maxContacts || 100,
            max_deals: freePlan?.maxDeals || 50,
            current_period_start: new Date(),
            current_period_end: sql`'infinity'`,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid product type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      subscription: result,
    });
  } catch (error) {
    console.error('Error activating free plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}