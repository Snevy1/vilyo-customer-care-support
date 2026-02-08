// providers/paypal.provider.ts
import { PaymentProvider,
    Subscription, 
  CreateSubscriptionParams, 
  CancelSubscriptionParams,
  GetSubscriptionParams
 } from "../interfaces/payment-provider.interface"; 

export class PayPalProvider implements PaymentProvider {
  readonly providerName = 'paypal';
  
  private baseUrl: string;
  private accessToken: string | null = null;
  
  constructor(private config: { 
    clientId: string; 
    clientSecret: string;
    environment?: 'sandbox' | 'live';
  }) {
    this.baseUrl = config.environment === 'sandbox' 
      ? 'https://api.sandbox.paypal.com'
      : 'https://api.paypal.com';
  }
  
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      // Simple cache - in production, implement proper token refresh
      return this.accessToken;
    }
    
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    
    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken!;
  }
  
  private async makeRequest(endpoint: string, options?: RequestInit) {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPal API error: ${error}`);
    }
    
    return response.json();
  }
  
  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    // PayPal requires a billing agreement (subscription) to be created
    // First, create a subscription plan (if not already created)
    // Then create a billing agreement for that plan
    
    // For simplicity, assuming params.planId is a PayPal plan ID
    const response = await this.makeRequest('/v1/billing/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: params.planId,
        subscriber: {
          payer_id: params.customerId,
        },
        application_context: {
          brand_name: "Your Company Name",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          payment_method: {
            payer_selected: "PAYPAL",
            payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
          },
        },
        custom_id: params.metadata?.organizationId || params.metadata?.customId,
        plan: {
          billing_cycles: [
            {
              frequency: {
                interval_unit: "MONTH",
                interval_count: 1,
              },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: 0, // 0 means infinite
              pricing_scheme: {
                fixed_price: {
                  value: "10.00", // Should come from plan configuration
                  currency_code: "USD",
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: {
              value: "0.00",
              currency_code: "USD",
            },
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3,
          },
        },
      }),
    });
    
    // PayPal returns links for approval - you need to redirect user to approval_url
    // This is simplified - in production, you'd handle the approval flow
    const approvalLink = response.links.find((link: any) => link.rel === 'approve');
    
    return {
      id: response.id,
      status: response.status, // Usually 'APPROVAL_PENDING' initially
      currentPeriodEnd: new Date(response.billing_info?.next_billing_time || Date.now() + 30 * 24 * 60 * 60 * 1000),
      customerId: response.subscriber?.payer_id || params.customerId,
      planId: response.plan_id,
      provider: 'paypal',
    };
  }
  
  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    await this.makeRequest(`/v1/billing/subscriptions/${params.subscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        reason: params.reason || "Customer requested cancellation",
      }),
    });
  }
  
  async getSubscription(params: GetSubscriptionParams): Promise<Subscription> {
    const response = await this.makeRequest(`/v1/billing/subscriptions/${params.subscriptionId}`);
    
    return {
      id: response.id,
      status: response.status,
      currentPeriodEnd: new Date(response.billing_info?.next_billing_time || Date.now()),
      customerId: response.subscriber?.payer_id || '',
      planId: response.plan_id,
      provider: 'paypal',
    };
  }
  
  // PayPal specific method - activate subscription after approval
  async activateSubscription(subscriptionId: string): Promise<void> {
    await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/activate`, {
      method: 'POST',
    });
  }
  
  // PayPal specific method - suspend subscription
  async suspendSubscription(subscriptionId: string, reason?: string): Promise<void> {
    await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({
        reason: reason || "Temporarily suspending subscription",
      }),
    });
  }
}

// Note: PayPal subscription flow is more complex:
// 1. Create subscription → returns approval URL
// 2. Redirect user to PayPal to approve
// 3. PayPal redirects back with token
// 4. Capture subscription with token
// This provider simplifies the flow - you may need to implement the full flow