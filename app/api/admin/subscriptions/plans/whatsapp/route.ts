import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client'; 
import { whatsAppPlans } from '@/db/schema'; 
import { eq, and, asc, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('activeOnly') !== 'false';
    const provider = url.searchParams.get('provider');
    const includeArchived = url.searchParams.get('includeArchived') === 'true';

    // Build query conditions
    const conditions = [];
    
    if (activeOnly) {
      conditions.push(eq(whatsAppPlans.is_active, true));
    }
    
    if (provider) {
      conditions.push(eq(whatsAppPlans.provider, provider));
    }
    
    if (!includeArchived) {
      conditions.push(isNull(whatsAppPlans.archived_at)); // Fixed: use isNull instead of eq
    }

    const plans = await db
      .select()
      .from(whatsAppPlans)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(whatsAppPlans.sort_order), asc(whatsAppPlans.price));

    // Transform price from cents to dollars for frontend
    const transformedPlans = plans.map(plan => ({
      ...plan,
      price: plan.price / 100, // Convert cents to dollars
      features: Array.isArray(plan.features) ? plan.features : [],
      limits: typeof plan.limits === 'object' ? plan.limits : {}
    }));

    return NextResponse.json({
      success: true,
      data: transformedPlans,
      meta: {
        count: transformedPlans.length,
        currency: 'USD' // Default, could be dynamic based on user location
      }
    });

  } catch (error: any) {
    console.error('Error fetching WhatsApp plans:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch plans',
        message: error.message 
      },
      { status: 500 }
    );
  }
}