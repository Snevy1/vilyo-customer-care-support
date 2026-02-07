
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client'; 
import { whatsAppPlans } from '@/db/schema'; 
import { eq, and, desc, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {

    const planData = await params;
    const [plan] = await db
      .select()
      .from(whatsAppPlans)
      .where(eq(whatsAppPlans.plan_id, planData.planId))
      .limit(1);

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Transform price
    const transformedPlan = {
      ...plan,
      price: plan.price / 100,
      features: Array.isArray(plan.features) ? plan.features : [],
      limits: typeof plan.limits === 'object' ? plan.limits : {}
    };

    return NextResponse.json({
      success: true,
      data: transformedPlan
    });

  } catch (error: any) {
    console.error('Error fetching WhatsApp plan:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch plan',
        message: error.message 
      },
      { status: 500 }
    );
  }
}