// app/api/plans/webchat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { webchatPlans } from '@/db/schema'; 
import { eq, and, asc, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('activeOnly') !== 'false';
    const provider = url.searchParams.get('provider');
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const includeFree = url.searchParams.get('includeFree') !== 'false';

    // Build query conditions
    const conditions = [];
    
    if (activeOnly) {
      conditions.push(eq(webchatPlans.is_active, true));
    }
    
    if (provider) {
      conditions.push(eq(webchatPlans.provider, provider));
    }
    
    if (!includeArchived) {
      conditions.push(isNull(webchatPlans.archived_at));
    }
    
    if (!includeFree) {
      conditions.push(eq(webchatPlans.price, 0));
    }

    const plans = await db
      .select()
      .from(webchatPlans)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(webchatPlans.sort_order), asc(webchatPlans.price));

    // Transform for frontend
    const transformedPlans = plans.map(plan => ({
      id: plan.id,
      plan_id: plan.plan_id,
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description,
      price: plan.price / 100, // Convert cents to dollars
      currency: plan.currency,
      billing_interval: plan.billing_interval,
      trial_period_days: plan.trial_period_days,
      features: Array.isArray(plan.features) ? plan.features : [],
      limits: typeof plan.limits === 'object' ? plan.limits : {},
      integrations: Array.isArray(plan.integrations) ? plan.integrations : [],
      is_active: plan.is_active,
      is_default: plan.is_default,
      provider: plan.provider,
      max_chats_per_month: plan.max_chats_per_month,
      max_agents: plan.max_agents,
      ai_automation: plan.ai_automation,
      custom_branding: plan.custom_branding,
      custom_domains: plan.custom_domains
    }));

    return NextResponse.json({
      success: true,
      data: transformedPlans,
      meta: {
        count: transformedPlans.length,
        currency: 'USD'
      }
    });

  } catch (error: any) {
    console.error('Error fetching webchat plans:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch webchat plans',
        message: error.message 
      },
      { status: 500 }
    );
  }
}