// app/api/webhooks/subscriptions/route.ts - Handle webhooks from providers
import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '../../subscriptions/factories/payment-provider.factory'; 
import { SubscriptionService } from '@/lib/subscriptions/services/subscription-service'; 
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get('x-paystack-signature') || 
                      headersList.get('stripe-signature') ||
                      headersList.get('paypal-transmission-id');
    
    const body = await request.text();
    const event = JSON.parse(body);
    
    // Determine provider from event or signature
    let provider: 'paystack' | 'stripe' | 'paypal' = 'paystack';
    if (headersList.get('stripe-signature')) provider = 'stripe';
    if (headersList.get('paypal-transmission-id')) provider = 'paypal';
    
    const paymentProvider = PaymentProviderFactory.createProvider(provider);
    const service = new SubscriptionService(paymentProvider);
    
    // Handle different event types
    switch(event.event || event.type) {
      // Paystack events
      case 'subscription.create':
      case 'subscription.enable':
        await handleSubscriptionCreated(event, service);
        break;
        
      case 'subscription.disable':
        await handleSubscriptionCancelled(event, service);
        break;
        
      case 'subscription.not_renew':
        await handleSubscriptionExpired(event, service);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event, service);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event, service);
        break;
        
      // Stripe events
      case 'customer.subscription.created':
        await handleStripeSubscriptionCreated(event, service);
        break;
        
      case 'customer.subscription.updated':
        await handleStripeSubscriptionUpdated(event, service);
        break;
        
      case 'customer.subscription.deleted':
        await handleStripeSubscriptionDeleted(event, service);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.event || event.type}`);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: `Webhook error: ${error.message}` },
      { status: 400 }
    );
  }
}

async function handleSubscriptionCreated(event: any, service: SubscriptionService) {
  // Extract subscription info from event
  const subscription = event.data;
  
  // Update subscription status in database
  // You'd need to find which product type this subscription is for
  // This would require storing a mapping or metadata
}

async function handleSubscriptionCancelled(event: any, service: SubscriptionService) {
  // Handle cancellation
}

// ... other webhook handlers