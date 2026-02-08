// This route setsUp payment providers like getting a customerId etc


import { cookies } from 'next/headers';
import { PaymentProviderFactory } from '../factories/payment-provider.factory'; 
import { getPlanId } from '@/lib/subscriptions/services/subscription-plans';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { organization_id, email } = JSON.parse(userSession);
    
    const body = await request.json();
    const { 
      productType, 
      planTier, 
      paymentProvider,
    } = body;
    
    // Get plan ID
    const planId = getPlanId(productType, planTier, paymentProvider);
    
    if (!planId) {
      return NextResponse.json(
        { error: `Missing plan ID for ${productType}/${planTier}/${paymentProvider}` },
        { status: 400 }
      );
    }
    
    // Create provider
    const provider = PaymentProviderFactory.createProvider(paymentProvider);
    
    // Check if setup is required
    if (!provider.requiresSetup() || !provider.setupPaymentMethod) {
      return NextResponse.json(
        { 
          requiresSetup: false,
          message: 'No setup required, proceed to create subscription directly'
        }
      );
    }

    // This is critical, we must first create or fetch customerId, create because stripe will create for us and fetch because psypal will use orgId



     let providerCustomerId: string;

     // 1. Check if customer already exists in database
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organization_id));
    
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }



    // 2. Get customer ID based on provider
    if (paymentProvider === 'stripe') {
      if (org.stripe_customer_id) {
        // Customer exists, use it
        providerCustomerId = org.stripe_customer_id;
      } else {
        // Create new Stripe customer
        if (!provider.createCustomer) {
          return NextResponse.json(
            { error: 'Provider does not support customer creation' },
            { status: 500 }
          );
        }
        
        const customer = await provider.createCustomer({
          email: email,
          name: org.name,
          metadata: {
            organizationId: organization_id,
          },
        });
        
        providerCustomerId = customer.customerId;
        
        // Save to database
        await db
          .update(organizations)
          .set({ 
            stripe_customer_id: providerCustomerId,
            updated_at: new Date(),
          })
          .where(eq(organizations.id, organization_id));
      }
    } else if (paymentProvider === 'paypal') {
      // PayPal uses organization ID directly
      providerCustomerId = organization_id;
    } else {
      // Other providers...
      providerCustomerId = organization_id;
    }
    
    // Setup payment method
    const setupResponse = await provider.setupPaymentMethod({
      customerId: providerCustomerId,
      metadata: {
        organizationId: organization_id,
        productType,
        planTier,
        planId,
        email,
      },
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/finalize`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
    });
    
    return NextResponse.json({
      requiresSetup: true,
      customerId: providerCustomerId,
      ...setupResponse,
      // Include these for the finalize step
      productType,
      planTier,
      planId,
    });
    
  } catch (error: any) {
    console.error('Error setting up subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}