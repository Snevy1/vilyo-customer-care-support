// app/api/create-checkout-session/route.ts
/* import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { planId, organizationId, billingCycle } = await req.json();

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get organization email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('organization_id', organizationId)
      .limit(1);

    if (profileError || !profile?.[0]?.email) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const priceId = billingCycle === 'yearly' 
      ? process.env[`STRIPE_${planId.toUpperCase()}_YEARLY_PRICE_ID`]
      : process.env[`STRIPE_${planId.toUpperCase()}_MONTHLY_PRICE_ID`];

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/plans`,
      customer_email: profile[0].email,
      metadata: {
        organization_id: organizationId,
        plan_id: planId,
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          plan_id: planId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
} */