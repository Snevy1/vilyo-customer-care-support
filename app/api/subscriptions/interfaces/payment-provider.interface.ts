// interfaces/payment-provider.interface.ts
export interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: Date;
  customerId: string;
  planId: string;
  provider: 'paystack' | 'stripe' | 'paypal';
}

export interface CreateSubscriptionParams {
  customerId: string;
  planId: string;
  metadata?: Record<string, any>;
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  reason?: string;
}

export interface GetSubscriptionParams {
  subscriptionId: string;
}

// The "Driver's License" all providers must have
export interface PaymentProvider {
  readonly providerName: string;
  
  createSubscription(params: CreateSubscriptionParams): Promise<Subscription>;
  cancelSubscription(params: CancelSubscriptionParams): Promise<void>;
  getSubscription(params: GetSubscriptionParams): Promise<Subscription>;
  // Optional: updateSubscription, listSubscriptions, etc.
}