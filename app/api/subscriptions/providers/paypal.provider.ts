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
import axios from "axios";

export class PayPalProvider implements PaymentProvider {
  readonly providerName = 'paypal';
  private baseUrl: string;
  
  constructor(private config: { 
    clientId: string; 
    clientSecret: string; 
    environment: 'sandbox' | 'live';
  }) {
    this.baseUrl = config.environment === 'live' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }
  
  requiresSetup(): boolean {
    return true; // PayPal needs user approval
  }

  //  PayPal doesn't need customer creation (optional)
  async createCustomer?(params: CreateCustomerParams): Promise<CreateCustomerResponse> {
    // PayPal doesn't have a separate customer concept
    // Just return the organization ID as customerId
    return {
      customerId: params.metadata?.organizationId || '',
      email: params.email,
    };
  }
  
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString('base64');
    
    const response = await axios.post(
      `${this.baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    return response.data.access_token;
  }
  
  // NEW: Setup payment method (creates PayPal subscription for approval)
  async setupPaymentMethod(params: SetupPaymentMethodParams): Promise<SetupPaymentMethodResponse> {
    const accessToken = await this.getAccessToken();
    
    // Note: For PayPal, we need the plan_id in metadata
    const planId = params.metadata?.planId;
    if (!planId) {
      throw new Error('PayPal requires planId in metadata');
    }
    
    const subscriptionData = {
      plan_id: planId,
      subscriber: {
        email_address: params.metadata?.email,
      },
      application_context: {
        brand_name: 'Vilyo',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: params.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        cancel_url: params.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
      },
      custom_id: params.customerId, //  organization ID
    };
    
    const response = await axios.post(
      `${this.baseUrl}/v1/billing/subscriptions`,
      subscriptionData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
      }
    );
    
    const subscription = response.data;
    const approvalLink = subscription.links.find((link: any) => link.rel === 'approve');
    
    return {
      requiresRedirect: true,
      redirectUrl: approvalLink.href,
      setupId: subscription.id, // PayPal subscription ID
    };
  }
  
  // NEW: Finalize subscription after user approves on PayPal
  async finalizeSubscription(params: FinalizeSubscriptionParams): Promise<Subscription> {
    const accessToken = await this.getAccessToken();
    
    // Get subscription details
    const response = await axios.get(
      `${this.baseUrl}/v1/billing/subscriptions/${params.setupId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const subscription = response.data;
    
    if (subscription.status !== 'ACTIVE') {
      throw new Error(`PayPal subscription not active. Status: ${subscription.status}`);
    }
    
    return {
      id: subscription.id,
      status: 'active',
      currentPeriodEnd: new Date(subscription.billing_info.next_billing_time),
      customerId: subscription.custom_id,
      planId: subscription.plan_id,
      provider: 'paypal',
    };
  }
  
  // EXISTING: Not typically used for PayPal (use setupPaymentMethod instead)
  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    throw new Error('Use setupPaymentMethod() for PayPal subscriptions');
  }
  
  async cancelSubscription(params: any): Promise<void> {
    const accessToken = await this.getAccessToken();
    
    await axios.post(
      `${this.baseUrl}/v1/billing/subscriptions/${params.subscriptionId}/cancel`,
      { reason: params.reason || 'Customer requested' },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  async getSubscription(params: any): Promise<Subscription> {
    const accessToken = await this.getAccessToken();
    
    const response = await axios.get(
      `${this.baseUrl}/v1/billing/subscriptions/${params.subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const subscription = response.data;
    
    return {
      id: subscription.id,
      status: subscription.status.toLowerCase(),
      currentPeriodEnd: new Date(subscription.billing_info.next_billing_time),
      customerId: subscription.custom_id,
      planId: subscription.plan_id,
      provider: 'paypal',
    };
  }
}
