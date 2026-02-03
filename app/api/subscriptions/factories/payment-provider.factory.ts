// factories/payment-provider.factory.ts
import { PaymentProvider } from '../interfaces/payment-provider.interface'; 
import { PayPalProvider } from '../providers/paypal.provider';
import { PaystackProvider } from '../providers/paystack.provider'; 
import { StripeProvider } from '../providers/stripe.provider'; 


export class PaymentProviderFactory {
  static createProvider(
    provider: 'paystack' | 'stripe' | 'paypal',
    config?: any
  ): PaymentProvider {
    switch(provider) {
      case 'paystack':
        return new PaystackProvider({
          secretKey: process.env.PAYSTACK_SECRET_KEY!,
          ...config,
        });
        
      case 'stripe':
        // Install: npm install stripe @types/stripe
        const Stripe = require('stripe');
        return new StripeProvider({
          secretKey: process.env.STRIPE_SECRET_KEY!,
          ...config,
        });
        
      case 'paypal':
        return new PayPalProvider({
          clientId: process.env.PAYPAL_CLIENT_ID!,
          clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
          environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
          ...config,
        });
        
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }
}