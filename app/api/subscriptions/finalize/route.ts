import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PaymentProviderFactory } from '../factories/payment-provider.factory'; 
import { SubscriptionService } from '@/lib/subscriptions/services/subscription-service';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { organization_id, user_id } = JSON.parse(userSession);
    
    const body = await request.json();
    const { 
      setupId,
      customerId, // Provider's customer ID (cus_xxx for Stripe) - from setup response
      productType, 
      planTier, 
      paymentProvider,
      planId,
      tenantId,
    } = body;
    
    if (!setupId || !customerId) {
      return NextResponse.json(
        { error: 'Missing setupId or customerId' },
        { status: 400 }
      );
    }
    
    // Create provider
    const provider = PaymentProviderFactory.createProvider(paymentProvider);
    
    // Finalize subscription
    if (!provider.finalizeSubscription) {
      return NextResponse.json(
        { error: 'Provider does not support finalization' },
        { status: 400 }
      );
    }
    
    const providerSub = await provider.finalizeSubscription({
      setupId,
      customerId, // Use provider's customer ID
      planId,
      metadata: {
        organizationId: organization_id,
        userId: user_id,
        productType,
        planTier,
      },
    });
    
    // Save to database
    const subscriptionService = new SubscriptionService(provider);
    
    const result = await subscriptionService.saveSubscriptionToDb({
      organizationId: organization_id,
      productType,
      planTier,
      paymentProvider,
      planId,
      tenantId,
      providerSubscription: providerSub,
    });
    
    return NextResponse.json({ 
      success: true, 
      subscription: result 
    });
    
  } catch (error: any) {
    console.error('Error finalizing subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}