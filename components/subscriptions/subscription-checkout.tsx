'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
} from '@stripe/react-stripe-js';
import {
  PayPalScriptProvider,
  
} from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiClient } from '@/lib/apiClient/apiClient';
import { ProviderSelection } from './providerSelection';
import { StripeCheckoutForm } from './checkoutForms/stripe-checkout';
import { PaystackCheckoutForm } from './checkoutForms/paystack-checkout';
import { PayPalButtonWrapper } from './checkoutForms/paypal-checkout';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  providerPlanId: string;
  trialDays?: number;
}

export interface PaymentProcessor {
  id: string;
  name: 'stripe' | 'paypal' | 'paystack';
  displayName: string;
  logoUrl: string;
  isEnabled: boolean;
  supportedCurrencies: string[];
}

export interface SubscriptionCheckoutProps {
  organizationId: string;
  productType: 'web_chat' | 'whatsapp' | 'crm';
  plan: SubscriptionPlan;
  tenantId?: string;
  onSuccess?: (subscription: SubscriptionResponse) => void;
  onCancel?: () => void;
  className?: string;
}

export interface SubscriptionResponse {
  id: string;
  provider: string;
  status: string;
  plan: string;
  customerId?: string;
}

// ============================================================================
// MAIN SUBSCRIPTION CHECKOUT COMPONENT
// ============================================================================

export function SubscriptionCheckout({
  organizationId,
  productType,
  plan,
  tenantId,
  onSuccess,
  onCancel,
  className,
}: SubscriptionCheckoutProps) {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<PaymentProcessor | null>(null);
  const [processors, setProcessors] = useState<PaymentProcessor[]>([]);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [paypalClientId, setPaypalClientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isMountedRef = useRef(true);
  const initializationRef = useRef(false);

  // Initialize payment processors
  useEffect(() => {
    isMountedRef.current = true;

    const initializeProcessors = async () => {
      // Prevent duplicate initialization
      if (initializationRef.current) return;
      initializationRef.current = true;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch available processors from API with authentication
        const data = await ApiClient.get<{ processors: PaymentProcessor[] }>(
          '/api/payment-processors'
        );

        if (!isMountedRef.current) return;

        if (!data.processors || !Array.isArray(data.processors)) {
          throw new Error('Invalid payment processors data');
        }

        // Filter to only enabled processors
        const enabledProcessors = data.processors.filter((p) => p.isEnabled);

        if (enabledProcessors.length === 0) {
          throw new Error('No payment methods are currently available');
        }

        setProcessors(enabledProcessors);

        // Initialize Stripe if available
        const stripeProcessor = enabledProcessors.find((p) => p.name === 'stripe');
        if (stripeProcessor) {
          try {
            const stripeKeyData = await ApiClient.get<{ publishableKey: string }>(
              '/api/payment-processors/stripe/key'
            );

            if (!isMountedRef.current) return;

            if (stripeKeyData.publishableKey) {
              setStripePromise(loadStripe(stripeKeyData.publishableKey));
            }
          } catch (err) {
            console.error('Failed to load Stripe key:', err);
          }
        }

        // Initialize PayPal if available
        const paypalProcessor = enabledProcessors.find((p) => p.name === 'paypal');
        if (paypalProcessor) {
          try {
            const paypalKeyData = await ApiClient.get<{ clientId: string }>(
              '/api/payment-processors/paypal/client-id'
            );

            if (!isMountedRef.current) return;

            if (paypalKeyData.clientId) {
              setPaypalClientId(paypalKeyData.clientId);
            }
          } catch (err) {
            console.error('Failed to load PayPal client ID:', err);
          }
        }

        // Auto-select first available provider
        if (enabledProcessors.length > 0 && isMountedRef.current) {
          setSelectedProvider(enabledProcessors[0]);
        }
      } catch (error) {
        console.error('Failed to initialize payment processors:', error);
        const message =
          error instanceof Error ? error.message : 'Failed to load payment methods';
        
        if (isMountedRef.current) {
          setError(message);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeProcessors();

    return () => {
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array - only run once

  const handleSuccess = useCallback(
    (subscription: SubscriptionResponse) => {
      setSuccess(true);

      if (onSuccess) {
        onSuccess(subscription);
      }

      toast.success('Subscription activated successfully!');

      // Redirect after delay
      setTimeout(() => {
        router.push('/dashboard/subscriptions');
      }, 2000);
    },
    [onSuccess, router]
  );

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    initializationRef.current = false;
    window.location.reload();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex min-h-100 items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-gray-600">Loading payment options...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleRetry} className="flex-1">
              Retry
            </Button>
            {onCancel && (
              <Button onClick={onCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (success) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <CheckCircle className="mx-auto mb-4 h-20 w-20 text-green-500" />
          <h3 className="mb-2 text-2xl font-bold">Subscription Successful!</h3>
          <p className="mb-6 text-gray-600">
            Your {plan.name} subscription has been activated.
          </p>
          <Button onClick={() => router.push('/dashboard/subscriptions')} size="lg">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Main checkout UI
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{plan.name}</h2>
            <p className="mt-2 text-gray-600">{plan.description}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-3xl font-bold">
              {plan.currency} {plan.price}
            </div>
            <div className="text-sm text-gray-600">per {plan.interval}</div>
            {plan.trialDays && (
              <Badge variant="secondary" className="mt-2">
                {plan.trialDays} day free trial
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plan Features */}
        <div>
          <h4 className="mb-3 font-semibold">What's included:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Provider Selection or Payment Form */}
        {!selectedProvider ? (
          <>
            <div>
              <h4 className="mb-4 font-semibold">Select Payment Method:</h4>
              <ProviderSelection
                availableProcessors={processors}
                onSelectProvider={setSelectedProvider}
                selectedProvider={selectedProvider}
              />
            </div>

            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setSelectedProvider(null)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Change Payment Method
            </Button>

            {/* Payment Form */}
            <div className="space-y-4">
              {selectedProvider.name === 'stripe' && stripePromise && (
                <Elements stripe={stripePromise}>
                  <StripeCheckoutForm
                    plan={plan}
                    organizationId={organizationId}
                    productType={productType}
                    tenantId={tenantId}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </Elements>
              )}

              {selectedProvider.name === 'paypal' && paypalClientId && (
                <PayPalScriptProvider
                  options={{
                    clientId: paypalClientId,
                    currency: plan.currency,
                    intent: 'subscription',
                    vault: true,
                  }}
                >
                  <PayPalButtonWrapper
                    plan={plan}
                    organizationId={organizationId}
                    productType={productType}
                    tenantId={tenantId}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </PayPalScriptProvider>
              )}

              {selectedProvider.name === 'paystack' && (
                <PaystackCheckoutForm
                  plan={plan}
                  organizationId={organizationId}
                  productType={productType}
                  tenantId={tenantId}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              )}
            </div>

            {/* Trust indicators */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
                <div className="flex items-center">
                  <ShieldCheck className="mr-1 h-4 w-4" />
                  Secure Payment
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Cancel Anytime
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// USAGE EXAMPLE COMPONENT
// ============================================================================

export function SubscriptionCheckoutExample() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Example plans
  const plans: SubscriptionPlan[] = [
    {
      id: 'web_chat_pro',
      name: 'Pro',
      description: 'Advanced web chat features for growing teams',
      price: 29,
      currency: 'USD',
      interval: 'month',
      trialDays: 14,
      features: [
        'Unlimited chat conversations',
        'Advanced analytics dashboard',
        'Custom branding options',
        'Priority email support',
        'API access',
      ],
      providerPlanId: 'price_web_chat_pro_monthly',
    },
    {
      id: 'crm_enterprise',
      name: 'Enterprise',
      description: 'Complete CRM solution for large organizations',
      price: 99,
      currency: 'USD',
      interval: 'month',
      trialDays: 30,
      features: [
        'Unlimited contacts & deals',
        'Advanced workflow automation',
        'Custom reports & dashboards',
        'Full API access',
        'Dedicated account manager',
        'SSO & advanced security',
        'SLA guarantee',
      ],
      providerPlanId: 'P-CRM-ENTERPRISE',
    },
  ];

  if (selectedPlan) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <SubscriptionCheckout
          organizationId="org_123"
          productType="web_chat"
          plan={selectedPlan}
          onSuccess={(subscription) => {
            console.log('Subscription created:', subscription);
          }}
          onCancel={() => setSelectedPlan(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="mt-2 text-gray-600">Start your free trial today</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative flex flex-col">
            {plan.trialDays && (
              <Badge className="absolute right-4 top-4" variant="secondary">
                {plan.trialDays} day trial
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-600">/{plan.interval}</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="mb-4 text-gray-600">{plan.description}</p>
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <CheckCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => setSelectedPlan(plan)} size="lg" className="w-full">
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600">
          All plans include a free trial. No credit card required to start.
        </p>
      </div>
    </div>
  );
}