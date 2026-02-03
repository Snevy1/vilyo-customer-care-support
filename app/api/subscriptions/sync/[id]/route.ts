// app/api/subscriptions/sync/[id]/route.ts - Sync subscription status from provider
import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '../../factories/payment-provider.factory'; 
import { SubscriptionService } from '@/lib/subscriptions/services/subscription-service';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { organization_id, role } = JSON.parse(userSession);
    const subscriptionId = params.id;
    
    // Get product type from query params
    const url = new URL(request.url);
    const productType = url.searchParams.get('productType') as any;
    
    if (!productType) {
      return NextResponse.json(
        { error: 'productType query parameter is required' },
        { status: 400 }
      );
    }
    
    // For now, use paystack provider (in production, you'd need to get the provider from the subscription)
    const paymentProvider = PaymentProviderFactory.createProvider('paystack');
    const service = new SubscriptionService(paymentProvider);
    
    // Get subscription to verify access
    const subscription = await service.getSubscriptionById(subscriptionId, productType);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    // Check access
    if (role !== 'admin' && role !== 'super_admin' && subscription.organizationId !== organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Sync status
    const result = await service.syncSubscriptionStatus(subscriptionId, productType);
    
    // Get updated subscription
    const updatedSubscription = await service.getSubscriptionById(subscriptionId, productType);
    
    return NextResponse.json({
      success: true,
      message: 'Subscription status synced successfully',
      previousStatus: subscription.status,
      currentStatus: updatedSubscription?.status,
      subscription: updatedSubscription,
    });
    
  } catch (error: any) {
    console.error('Error syncing subscription:', error);
    return NextResponse.json(
      { error: `Failed to sync subscription: ${error.message}` },
      { status: 500 }
    );
  }
}