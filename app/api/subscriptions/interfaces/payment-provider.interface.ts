// interfaces/payment-provider.interface.ts
export interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: Date;
  customerId: string;
  planId: string;
  provider: 'paystack' | 'stripe' | 'paypal';
  current_period_end?: Date;
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


export interface PaymentProvider {
  readonly providerName: string;

  // Customer management
  createCustomer?(params: CreateCustomerParams): Promise<CreateCustomerResponse>;
  getCustomer?(customerId: string): Promise<any>;
  
  
  createSubscription(params: CreateSubscriptionParams): Promise<Subscription>;
  cancelSubscription(params: CancelSubscriptionParams): Promise<void>;
  getSubscription(params: GetSubscriptionParams): Promise<Subscription>;
  
  // NEW: Methods for setup flow
  requiresSetup(): boolean; // Does this provider need setup before subscription?
  setupPaymentMethod?(params: SetupPaymentMethodParams): Promise<SetupPaymentMethodResponse>;
  finalizeSubscription?(params: FinalizeSubscriptionParams): Promise<Subscription>;
}

export interface SetupPaymentMethodParams {
  customerId: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface SetupPaymentMethodResponse {
  requiresRedirect: boolean;
  clientSecret?: string; // For Stripe (frontend use)
  redirectUrl?: string; // For PayPal
  setupId?: string; // Reference ID
}

export interface FinalizeSubscriptionParams {
  setupId: string; // Setup Intent ID or PayPal subscription ID
  customerId: string;
  planId: string;
  metadata?: Record<string, any>;
}




export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface CreateCustomerResponse {
  customerId: string; // Provider's customer ID
  email: string;
}