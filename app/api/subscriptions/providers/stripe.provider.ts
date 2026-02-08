import { 
  CreateSubscriptionParams, 
  PaymentProvider, 
  Subscription,
  SetupPaymentMethodParams,
  SetupPaymentMethodResponse,
  FinalizeSubscriptionParams,
  CreateCustomerParams,
  CreateCustomerResponse
} from "../interfaces/payment-provider.interface";
import Stripe from "stripe";

export class StripeProvider implements PaymentProvider {
  readonly providerName = 'stripe';
  private stripe: Stripe;
  
  constructor(private config: { secretKey: string }) {
    this.stripe = new Stripe(this.config.secretKey, {
      apiVersion: "2026-01-28.clover",
    });
  }
  
  requiresSetup(): boolean {
    return true; // Stripe needs payment method setup
  }


   //  Create Stripe customer
  async createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResponse> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });
    
    return {
      customerId: customer.id, // This is the cus_xxx ID
      email: customer.email!,
    };
  }

  //  Get existing customer
  async getCustomer(customerId: string) {
    return await this.stripe.customers.retrieve(customerId);
  }
  
  //  Setup payment method (creates Setup Intent)
  async setupPaymentMethod(params: SetupPaymentMethodParams): Promise<SetupPaymentMethodResponse> {
    const setupIntent = await this.stripe.setupIntents.create({
      customer: params.customerId, // Now this will be cus_xxx
      payment_method_types: ['card'],
      metadata: params.metadata,
    });
    
    return {
      requiresRedirect: false,
      clientSecret: setupIntent.client_secret!, // Fronend uses this.
      setupId: setupIntent.id,
    };
  }
  
  //  Finalize subscription after payment method is attached
  async finalizeSubscription(params: FinalizeSubscriptionParams): Promise<Subscription> {
    const setupIntent = await this.stripe.setupIntents.retrieve(params.setupId);
    
    if (setupIntent.status !== 'succeeded') {
      throw new Error(`Setup Intent not completed. Status: ${setupIntent.status}`);
    }
    
    const paymentMethodId = setupIntent.payment_method as string;
    
    const subscription = await this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.planId }],
      default_payment_method: paymentMethodId,
      metadata: params.metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription' 
      },
      expand: ['latest_invoice.payment_intent'],
    });
    
    const periodEnd = subscription.items.data[0]?.current_period_end; // we will fix this later
    
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(periodEnd * 1000),
      customerId: subscription.customer as string,
      planId: subscription.items.data[0].price.id,
      provider: 'stripe',
    };
  }
  
  //  Direct subscription creation (for when payment method already exists)
  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    const subscription = await this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.planId }],
      metadata: params.metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    
    const periodEnd = subscription.items.data[0]?.current_period_end;
    
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(periodEnd * 1000),
      customerId: subscription.customer as string,
      planId: subscription.items.data[0].price.id,
      provider: 'stripe',
    };
  }
  
  async cancelSubscription(params: any): Promise<void> {
    await this.stripe.subscriptions.cancel(params.subscriptionId, {
      cancellation_details: params.reason ? { comment: params.reason } : undefined,
    });
  }
  
  async getSubscription(params: any): Promise<Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(params.subscriptionId);
    
    if ('deleted' in subscription) {
      throw new Error('Subscription has been deleted.');
    }
    
    const periodEnd = subscription.items.data[0]?.current_period_end;
    
    return {
      id: subscription.id,
      status: subscription.status as any,
      currentPeriodEnd: new Date(periodEnd * 1000),
      customerId: subscription.customer as string,
      planId: subscription.items.data[0].price.id,
      provider: 'stripe',
    };
  }
}