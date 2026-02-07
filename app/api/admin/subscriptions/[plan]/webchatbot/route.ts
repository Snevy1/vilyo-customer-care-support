// app/api/plans/webchat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { webchatPlans } from '@/db/schema'; 
import { eq, and, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const planId = url.searchParams.get('plan_id');
    
    // Require plan_id parameter
    if (!planId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required parameter: plan_id'
        },
        { status: 400 }
      );
    }

    // Optional filters
    const activeOnly = url.searchParams.get('activeOnly') !== 'false';
    const includeArchived = url.searchParams.get('includeArchived') === 'true';

    // Build query conditions
    const conditions = [eq(webchatPlans.plan_id, planId)];
    
    if (activeOnly) {
      conditions.push(eq(webchatPlans.is_active, true));
    }


    if (!includeArchived) {
          conditions.push(isNull(webchatPlans.archived_at));
        }

    const result = await db
      .select()
      .from(webchatPlans)
      .where(and(...conditions))
      .limit(1);

    // Check if plan exists
    if (!result || result.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Plan not found',
          message: `No plan found with plan_id: ${planId}`
        },
        { status: 404 }
      );
    }

    const plan = result[0];

    // Transform for frontend
    const transformedPlan = {
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
    };

    return NextResponse.json({
      success: true,
      data: transformedPlan
    });

  } catch (error: any) {
    console.error('Error fetching webchat plan:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch webchat plan',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
