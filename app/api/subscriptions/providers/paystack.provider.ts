import { CancelSubscriptionParams, CreateSubscriptionParams, GetSubscriptionParams, PaymentProvider, Subscription } from "../interfaces/payment-provider.interface";


export class PaystackProvider implements PaymentProvider {
  readonly providerName = 'paystack';
  
  constructor(private config: { secretKey: string }) {}
  
  private async makeRequest(endpoint: string, options?: RequestInit) {
    const response = await fetch(`https://api.paystack.co${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    const data = await this.makeRequest('/subscription', {
      method: 'POST',
      body: JSON.stringify({
        customer: params.customerId,
        plan: params.planId,
        metadata: params.metadata,
      }),
    });
    
    return {
      id: data.data.subscription_code,
      status: data.data.status,
      currentPeriodEnd: new Date(data.data.next_payment_date),
      customerId: data.data.customer.customer_code,
      planId: data.data.plan.plan_code,
      provider: 'paystack',
    };
  }
  
  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    await this.makeRequest(`/subscription/${params.subscriptionId}/disable`, {
      method: 'POST',
    });
  }
  
  async getSubscription(params: GetSubscriptionParams): Promise<Subscription> {
    const data = await this.makeRequest(`/subscription/${params.subscriptionId}`);
    
    return {
      id: data.data.subscription_code,
      status: data.data.status,
      currentPeriodEnd: new Date(data.data.next_payment_date),
      customerId: data.data.customer.customer_code,
      planId: data.data.plan.plan_code,
      provider: 'paystack',
    };
  }
}