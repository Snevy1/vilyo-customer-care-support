// app/api/subscriptions/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '../factories/payment-provider.factory'; 
import { SubscriptionService } from '@/lib/subscriptions/services/subscription-service'; 
import { getPlanId } from '@/lib/subscriptions/services/subscription-plans';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {

    try {

        const cookieStore = await cookies();
                const userSession = cookieStore.get('user_session')?.value;
                
                if (!userSession) {
                  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
                }
    
    

    const body = await request.json();
  const { 
    organizationId, 
    productType, 
    planTier, 
    paymentProvider, // 'paystack', 'stripe', etc.
    customerId,
    tenantId,
    metadata
  } = body;
  
  // 1. Get plan ID based on provider
  const planId = getPlanId(productType, planTier, paymentProvider);

  if(!planId){
    return NextResponse.json(
          { error: `Missing required plainId` },
          { status: 400 }
        );
  }
  
  // 2. Create the right provider
  const paymentProviderInstance = PaymentProviderFactory.createProvider(
    paymentProvider,
    { /* additional config */ }
  );
  
  // 3. Create subscription service with that provider
  const subscriptionService = new SubscriptionService(paymentProviderInstance);
  
  // 4. Create subscription
  const subscription = await subscriptionService.createSubscription({
    organizationId,
    productType,
    planTier,
    paymentProvider, // Pass which provider
    planId,
    customerId,
    tenantId,
    metadata,
  });
  
  return NextResponse.json({ success: true, subscription });

        
    } catch (error) {
        return NextResponse.json(
          { error: `An error occured while creating a subscription` },
          { status: 400 }
        );
        
    }
  
}



