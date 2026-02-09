<<<<<<< HEAD
import React, { useState, useCallback, useRef } from 'react';
import { SubscriptionPlan, SubscriptionResponse } from "../subscription-checkout";
import { subscriptionApi } from '@/lib/apiClient/apiClient'; 
import { Button } from '@/components/ui/button';
import { useStripe } from '@stripe/react-stripe-js';
import toast from "react-hot-toast";
import { Loader2, ShieldCheck } from "lucide-react";
=======
import { SubscriptionPlan, SubscriptionResponse } from "../subscription-checkout";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import toast from "react-hot-toast";
import { ApiClient } from "@/lib/apiClient/apiClient";
import { Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from '@/components/ui/alert';
>>>>>>> 27ce5d12c2c16ea2bb487460e07c595c66e8d1de

interface StripeCheckoutFormProps {
  plan: SubscriptionPlan;
  organizationId: string;
  productType: string;
  tenantId?: string;
  onSuccess: (subscription: SubscriptionResponse) => void;
  onError: (error: string) => void;
}

export const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  plan,
  organizationId,
  productType,
  tenantId,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    clientSecret: string;
    customerId: string;
    setupId: string;
    planId: string;
  } | null>(null);
  const processingRef = useRef(false);

<<<<<<< HEAD
  const handleSubmit = useCallback(async () => {
=======
  // Initialize setup intent on mount
  useEffect(() => {
    const initializeSetup = async () => {
      try {
        setIsLoading(true);

        const response = await ApiClient.post<{
          requiresSetup: boolean;
          clientSecret?: string;
          customerId?: string;
          setupId?: string;
          productType: string;
          planTier: string;
          planId: string;
        }>('/api/subscriptions/setup', {
          productType,
          planTier: plan.name.toLowerCase(),
          paymentProvider: 'stripe',
        });

        if (!response.requiresSetup) {
          onError('Setup not required for this payment method');
          return;
        }

        if (!response.clientSecret || !response.customerId || !response.planId) {
          throw new Error('Invalid setup response from server');
        }

        setSetupData({
          clientSecret: response.clientSecret,
          customerId: response.customerId,
          setupId: response.setupId || '',
          planId: response.planId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to initialize payment';
        console.error('Setup error:', error);
        onError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSetup();
  }, [productType, plan.name, onError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
>>>>>>> 27ce5d12c2c16ea2bb487460e07c595c66e8d1de
    if (processingRef.current) {
      toast.error('Checkout already in progress');
      return;
    }

    if (!stripe || !elements || !setupData) {
      onError('Payment system is not ready. Please refresh the page.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      return;
    }

    try {
      processingRef.current = true;
      setIsLoading(true);

<<<<<<< HEAD
      // Use the centralized service instead of ApiClient
      const session = await subscriptionApi.createCheckoutSession({
        organizationId,
        productType,
        planTier: plan.name.toLowerCase(),
        paymentProvider: 'stripe',
        planId: plan.providerPlanId,
        tenantId,
        successUrl: `${window.location.origin}/dashboard/finance/subscriptions?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/dashboard/finance/subscriptions?canceled=true`,
      });
=======
      // Step 1: Confirm card setup
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        setupData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              // You can add user info here if available
            },
          },
        }
      );
>>>>>>> 27ce5d12c2c16ea2bb487460e07c595c66e8d1de

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (!setupIntent || setupIntent.status !== 'succeeded') {
        throw new Error('Payment method setup failed');
      }
<<<<<<< HEAD
    } catch (error: any) {
      // Axios errors in your new paradigm will have the message extracted by the interceptor
      const message = error.message || 'Failed to initiate checkout';
=======

      // Step 2: Finalize subscription on backend
      const subscription = await ApiClient.post<SubscriptionResponse>(
        '/api/subscriptions/finalize',
        {
          setupId: setupIntent.id,
          customerId: setupData.customerId,
          productType,
          planTier: plan.name.toLowerCase(),
          planId: setupData.planId,
          paymentProvider: 'stripe',
          tenantId,
        }
      );

      onSuccess(subscription);
      toast.success('Subscription activated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete checkout';
>>>>>>> 27ce5d12c2c16ea2bb487460e07c595c66e8d1de
      console.error('Stripe checkout error:', error);
      onError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      processingRef.current = false;
    }
  }, [stripe, elements, setupData, plan, organizationId, productType, tenantId, onSuccess, onError]);

  if (!setupData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
        <span>Initializing payment...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Secure Payment Badge */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start">
          <ShieldCheck className="mr-3 mt-0.5 h-5 w-5 text-green-600" />
          <div className="text-sm text-green-900">
            <p className="font-medium">Secure Payment via Stripe</p>
            <p className="mt-1 text-green-700">
              Your payment information is encrypted and secure
            </p>
          </div>
        </div>
      </div>

      {/* Card Input */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <CreditCard className="mr-2 h-4 w-4" />
          Card Information
        </label>
        <div className="rounded-lg border border-gray-300 p-4 transition-colors hover:border-gray-400 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
                invalid: {
                  color: '#ef4444',
                  iconColor: '#ef4444',
                },
              },
              hidePostalCode: false,
            }}
          />
        </div>
      </div>

      {/* Trial Info */}
      {plan.trialDays && (
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Free Trial:</strong> You won't be charged for {plan.trialDays} days. 
            Cancel anytime before then to avoid charges.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {plan.trialDays 
              ? `Start ${plan.trialDays}-Day Free Trial`
              : `Subscribe for ${plan.currency} ${plan.price}/${plan.interval}`
            }
          </>
        )}
      </Button>

      {/* Terms */}
      <p className="text-center text-xs text-gray-500">
        By subscribing, you agree to automatic recurring payments.
        {plan.trialDays && ` Your card will be charged after the ${plan.trialDays}-day trial ends.`}
      </p>
    </form>
  );
<<<<<<< HEAD
}
=======
};
>>>>>>> 27ce5d12c2c16ea2bb487460e07c595c66e8d1de
