// app/api/subscriptions/search/route.ts - Search subscriptions
import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '../factories/payment-provider.factory';
import { SubscriptionService } from '@/lib/subscriptions/services/subscription-service';
import { cookies } from 'next/headers';

type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";


export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { organization_id, role } = JSON.parse(userSession);
    
    const url = new URL(request.url);

    const rawStatus = url.searchParams.get('status');
const allowedStatuses = ["active", "cancelled", "past_due", "trialing"] as const;

const status = allowedStatuses.includes(rawStatus as any)
  ? (rawStatus as typeof allowedStatuses[number])
  : undefined;


    const searchParams = {
      organizationId: url.searchParams.get('organizationId') || undefined,
      productType: url.searchParams.get('productType') as any,
      status: status,
      provider: url.searchParams.get('provider') as any,
      startDate: url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined,
      endDate: url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50,
      offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0,
    };
    
    // Non-admin users can only see their own organization's subscriptions
    if (role !== 'admin' && role !== 'super_admin') {
      searchParams.organizationId = organization_id;
    }
    
    // For now, use paystack provider (in production, you'd need to handle multiple providers)
    const paymentProvider = PaymentProviderFactory.createProvider('paystack');
    const service = new SubscriptionService(paymentProvider);
    
   
    const subscriptions = await service.searchSubscriptions(searchParams);
    
    return NextResponse.json({
      success: true,
      data: subscriptions,
      pagination: {
        total: subscriptions.length,
        limit: searchParams.limit,
        offset: searchParams.offset,
      }
    });
    
  } catch (error: any) {
    console.error('Error searching subscriptions:', error);
    return NextResponse.json(
      { error: `Failed to search subscriptions: ${error.message}` },
      { status: 500 }
    );
  }
}