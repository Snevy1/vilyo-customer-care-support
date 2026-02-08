import { CancelSubscriptionParams, CreateSubscriptionParams, GetSubscriptionParams, PaymentProvider, Subscription as LocalSubscription } from "../interfaces/payment-provider.interface";

import Stripe from "stripe";

export class StripeProvider implements PaymentProvider {
  readonly providerName = 'stripe';
  
  constructor(private config: { secretKey: string }) {
    // Initialize Stripe with the secret key
    this.stripe = new Stripe(this.config.secretKey);
  }
  
  private stripe: Stripe;
  
  async createSubscription(params: CreateSubscriptionParams): Promise<LocalSubscription> {
    const subscription = await this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.planId }],
      metadata: params.metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    const periodEnd = subscription.items?.data?.[0]?.current_period_end; // seems subscription.current_period_end is deprecated
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(periodEnd * 1000),
      customerId: subscription.customer as string,
      planId: subscription.items.data[0].price.id,
      provider: 'stripe',
    };
  }
  
  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    await this.stripe.subscriptions.cancel(params.subscriptionId, {
      cancellation_details: params.reason ? { comment: params.reason } : undefined,
    });
  }
  
  async getSubscription(params: GetSubscriptionParams): Promise<LocalSubscription> {
    const subscription = await this.stripe.subscriptions.retrieve(params.subscriptionId) as Stripe.Subscription;
    
    if ('deleted' in subscription) {
    throw new Error('Subscription has been deleted.');
  }
    const periodEnd = subscription.items?.data?.[0]?.current_period_end; // seems subscription.current_period_end is deprecated
    return {
      id: subscription.id,
      status: subscription.status as any,
      currentPeriodEnd: new Date((periodEnd ?? 0) * 1000),
      customerId: subscription.customer as string,
      planId: subscription.items.data[0].price.id,
      provider: 'stripe',
    };
  }
}

// You'll need to install Stripe: npm install stripe
// Add type: npm install @types/stripe