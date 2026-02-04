import React, { useState, useCallback, useRef } from 'react';
import { SubscriptionPlan, SubscriptionResponse } from "../subscription-checkout";
import { subscriptionApi } from '@/lib/apiClient/apiClient'; 
import { Button } from '@/components/ui/button';
import { useStripe } from '@stripe/react-stripe-js';
import toast from "react-hot-toast";
import { Loader2, ShieldCheck } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const processingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (processingRef.current) {
      toast.error('Checkout already in progress');
      return;
    }

    if (!stripe) {
      onError('Payment system is not ready. Please refresh the page.');
      return;
    }

    try {
      processingRef.current = true;
      setIsLoading(true);

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

      if (!session.id) {
        throw new Error('Invalid checkout session received');
      }

      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error: any) {
      // Axios errors in your new paradigm will have the message extracted by the interceptor
      const message = error.message || 'Failed to initiate checkout';
      console.error('Stripe checkout error:', error);
      onError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      processingRef.current = false;
    }
  }, [stripe, plan, organizationId, productType, tenantId, onError]);

  return (
    <div className="space-y-4">
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

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !stripe}
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
            Subscribe for ${plan.price}/{plan.interval}
            {plan.trialDays && (
              <span className="ml-2 text-xs opacity-90">
                ({plan.trialDays} day free trial)
              </span>
            )}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-gray-500">
        By subscribing, you agree to automatic recurring payments
      </p>
    </div>
  );
};