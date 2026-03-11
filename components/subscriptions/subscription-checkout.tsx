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
import { ProviderSelection } from './providerSelection';
import { StripeCheckoutForm } from './checkoutForms/stripe-checkout';
import { PaystackCheckoutForm } from './checkoutForms/paystack-checkout';
import { PayPalButtonWrapper } from './checkoutForms/paypal-checkout';
import { paymentProcessorsApi } from '@/lib/apiClient/apiClient';

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
  externalPlanId?: string;
  slug?: string;
  limits?: Record<string, any>;
  provider?: string;
  icon?:string;
  is_popular?: boolean;
}

export interface PaymentProcessor {
  id: string;
  provider: string;         // "stripe" | "paypal" | "paystack" | "mpesa"
  code: string;
  display_name: string;
  isEnabled: boolean;
  environment: "production" | "test";
  logo_url?: string | null;
  priority?: number;
  is_top_priority?: boolean;
}


export interface SubscriptionCheckoutProps {
  organizationId: string;
  productType: "webchat" | "whatsapp" | "bundle";
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






// ─── Types ────────────────────────────────────────────────────────────────────


interface Plan {
  name: string;
  description: string;
  price: number | string;
  currency: string;
  interval: string;
  trialDays?: number;
  features: string[];
}





// ─── Component ────────────────────────────────────────────────────────────────

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
  const [paypalClientId, setPaypalClientId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isMountedRef = useRef(true);
  const initializationRef = useRef(false);

  // ── Initialize processors ────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;

    const initializeProcessors = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      try {
        setIsLoading(true);
        setError(null);

        const data = await paymentProcessorsApi.PaymentProcessors();
        console.log("data", data);

        if (!isMountedRef.current) return;

        if (!data.processors || !Array.isArray(data.processors)) {
          throw new Error("Invalid payment processors data");
        }

        // Filter enabled, sort by priority (top priority first)
        const enabledProcessors: PaymentProcessor[] = data.processors
          .filter((p: PaymentProcessor) => p.isEnabled)
          .sort((a: PaymentProcessor, b: PaymentProcessor) => {
            if (a.is_top_priority && !b.is_top_priority) return -1;
            if (!a.is_top_priority && b.is_top_priority) return 1;
            return (a.priority ?? 999) - (b.priority ?? 999);
          });

        if (enabledProcessors.length === 0) {
          throw new Error("No payment methods are currently available");
        }

        setProcessors(enabledProcessors);

        // Pre-load Stripe publishable key if Stripe is configured
        const stripeProcessor = enabledProcessors.find(
          (p) => p.provider === "stripe"
        );
        if (stripeProcessor) {
          try {
            const stripeKeyData = await paymentProcessorsApi.StripeKey();
            if (!isMountedRef.current) return;
            if (stripeKeyData.publishableKey) {
              setStripePromise(loadStripe(stripeKeyData.publishableKey));
            }
          } catch (err) {
            console.error("Failed to load Stripe key:", err);
          }
        }

        // Pre-load PayPal client ID if PayPal is configured
        const paypalProcessor = enabledProcessors.find(
          (p) => p.provider === "paypal"
        );
        if (paypalProcessor) {
          try {
            const paypalKeyData = await paymentProcessorsApi.PaypalClientId();
            if (!isMountedRef.current) return;
            if (paypalKeyData.clientId) {
              setPaypalClientId(paypalKeyData.clientId);
            }
          } catch (err) {
            console.error("Failed to load PayPal client ID:", err);
          }
        }

        // Do NOT auto-select — let the user choose
        // (If you want to auto-select top priority, uncomment the line below)
        // setSelectedProvider(enabledProcessors[0]);
      } catch (err) {
        console.error("Failed to initialize payment processors:", err);
        if (isMountedRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to load payment methods"
          );
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };

    initializeProcessors();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleSuccess = useCallback(
    (subscription: SubscriptionResponse) => {
      setSuccess(true);
      onSuccess?.(subscription);
      toast.success("Subscription activated successfully!");
      setTimeout(() => router.push("/dashboard/finance/subscriptions"), 2000);
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

  const handleSelectProvider = useCallback((processor: PaymentProcessor) => {
    // Guard: Stripe requires a loaded promise
    if (processor.provider === "stripe" && !stripePromise) {
      toast.error("Stripe is not configured correctly. Please try another method.");
      return;
    }
    // Guard: PayPal requires a client ID
    if (processor.provider === "paypal" && !paypalClientId) {
      toast.error("PayPal is not configured correctly. Please try another method.");
      return;
    }
    setSelectedProvider(processor);
    setError(null);
  }, [stripePromise, paypalClientId]);

  // ── Derived ───────────────────────────────────────────────────────────────

  // Normalise the provider string for comparison — always lowercase
  const providerKey = selectedProvider?.provider?.toLowerCase() ?? "";

  // ── Render states ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex min-h-64 items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-sm text-zinc-500">Loading payment options…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !selectedProvider) {
    return (
      <Card className={className}>
        <CardContent className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
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

  if (success) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
          <h3 className="text-2xl font-bold">Subscription Successful!</h3>
          <p className="text-zinc-500">
            Your {plan.name} subscription has been activated.
          </p>
          <Button onClick={() => router.push("/dashboard/finance/subscriptions")} size="lg">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{plan.name}</h2>
            <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <div className="text-3xl font-bold">
              {plan.currency} {plan.price}
            </div>
            <div className="text-sm text-zinc-500">per {plan.interval}</div>
            {plan.trialDays && (
              <Badge variant="secondary" className="mt-2">
                {plan.trialDays}-day free trial
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plan Features */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-zinc-700">What's included:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm text-zinc-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Step 1: Provider selection ── */}
        {!selectedProvider ? (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-700">
              Select a payment method:
            </h4>

            {/* Provider grid */}
            <div className="grid gap-3">
              {processors.map((processor) => {
                const isStripeReady =
                  processor.provider !== "stripe" || !!stripePromise;
                const isPayPalReady =
                  processor.provider !== "paypal" || !!paypalClientId;
                const isReady = isStripeReady && isPayPalReady;

                return (
                  <button
                    key={processor.id}
                    onClick={() => handleSelectProvider(processor)}
                    disabled={!isReady}
                    className={`flex items-center gap-4 rounded-xl border-2 px-4 py-3 text-left text-zinc-800 transition-all
                      ${
                        isReady
                          ? "border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer"
                          : "border-zinc-100 opacity-40 cursor-not-allowed"
                      }
                    `}
                  >
                    {processor.logo_url ? (
                      <img
                        src={processor.logo_url}
                        alt={processor.display_name}
                        className="h-8 w-16 object-contain"
                      />
                    ) : (
                      <div className="h-8 w-16 rounded bg-zinc-100 flex items-center justify-center text-md text-zinc-800">
                        {processor.provider}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-800">
                        {processor.display_name}
                      </p>
                      {!isReady && (
                        <p className="text-xs text-zinc-400">Currently unavailable</p>
                      )}
                    </div>
                    {processor.is_top_priority && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            )}
          </div>
        ) : (
          /* ── Step 2: Payment form ── */
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProvider(null);
                setError(null);
              }}
              className="text-zinc-500 hover:text-zinc-700 -ml-2"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Change payment method
            </Button>

            {/* Selected provider label */}
            <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5">
              {selectedProvider.logo_url && (
                <img
                  src={selectedProvider.logo_url}
                  alt={selectedProvider.display_name}
                  className="h-6 w-12 object-contain"
                />
              )}
              <span className="text-sm font-medium text-zinc-700">
                {selectedProvider.display_name}
              </span>
              <Badge
                variant="outline"
                className={`ml-auto text-xs ${
                  selectedProvider.environment === "production"
                    ? "border-green-200 text-green-700"
                    : "border-amber-200 text-amber-700"
                }`}
              >
                {selectedProvider.environment}
              </Badge>
            </div>

            {/* Error within payment form */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* ── Stripe ── */}
            {providerKey === "stripe" && stripePromise && (
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

            {/* ── PayPal ── */}
            {providerKey === "paypal" && paypalClientId && (
              <PayPalScriptProvider
                options={{
                  clientId: paypalClientId,
                  currency: plan.currency,
                  intent: "subscription",
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

            {/* ── Paystack ── */}
            {providerKey === "paystack" && (
              <PaystackCheckoutForm
                plan={plan}
                organizationId={organizationId}
                productType={productType}
                tenantId={tenantId}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}

            {/* ── M-Pesa ── */}
            {providerKey === "mpesa" && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
                M-Pesa checkout coming soon.
              </div>
            )}

            {/* Unrecognised provider fallback */}
            {!["stripe", "paypal", "paystack", "mpesa"].includes(providerKey) && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">
                Payment form for "{selectedProvider.display_name}" is not implemented yet.
              </div>
            )}

            {/* Trust indicators */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center justify-center gap-6 text-xs text-zinc-500">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  Secure Payment
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Cancel Anytime
                </div>
              </div>
            </div>
          </div>
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
          productType="webchat"
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