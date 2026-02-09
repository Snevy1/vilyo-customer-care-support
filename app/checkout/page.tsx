'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubscriptionCheckout, SubscriptionPlan } from '@/components/subscriptions/subscription-checkout';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Plans definition (you can move this to a shared file)
const PLANS: Record<string, SubscriptionPlan> = {
  web_chat_starter: {
    id: 'web_chat_starter',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    price: 19,
    currency: 'USD',
    interval: 'month',
    trialDays: 14,
    features: [
      'Up to 1,000 conversations/month',
      'Basic analytics',
      'Email support',
      'Widget customization',
    ],
    providerPlanId: 'price_web_chat_starter', // This should match your Stripe/PayPal plan IDs
  },
  web_chat_pro: {
    id: 'web_chat_pro',
    name: 'Pro',
    description: 'Advanced features for growing teams',
    price: 49,
    currency: 'USD',
    interval: 'month',
    trialDays: 14,
    features: [
      'Unlimited conversations',
      'Advanced analytics dashboard',
      'Custom branding',
      'Priority support',
      'API access',
    ],
    providerPlanId: 'price_web_chat_pro',
  },
  web_chat_enterprise: {
    id: 'web_chat_enterprise',
    name: 'Enterprise',
    description: 'Complete solution for large organizations',
    price: 199,
    currency: 'USD',
    interval: 'month',
    trialDays: 30,
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
      'White-label options',
    ],
    providerPlanId: 'price_web_chat_enterprise',
  },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [checkoutData, setCheckoutData] = useState<{
    organizationId: string;
    productType: string;
    planTier: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get plan from URL
    const planId = searchParams.get('plan');
    
    if (!planId) {
      toast.error('No plan selected');
      router.push('/plans');
      return;
    }

    // Get checkout data from session storage
    const storedData = sessionStorage.getItem('checkout_plan');
    
    if (!storedData) {
      toast.error('Session expired. Please select a plan again.');
      router.push('/plans');
      return;
    }

    try {
      const data = JSON.parse(storedData);
      
      if (data.planId !== planId) {
        throw new Error('Plan mismatch');
      }

      const selectedPlan = PLANS[planId];
      
      if (!selectedPlan) {
        throw new Error('Invalid plan');
      }

      setPlan(selectedPlan);
      setCheckoutData(data);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Invalid checkout session');
      router.push('/plans');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, router]);

  const handleSuccess = (subscription: any) => {
    // Clear session storage
    sessionStorage.removeItem('checkout_plan');
    
    // Redirect to success page or dashboard
    router.push('/dashboard/payment-success?subscription=success');
  };

  const handleCancel = () => {
    // Clear session storage
    sessionStorage.removeItem('checkout_plan');
    
    // Go back to plans
    router.push('/plans');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!plan || !checkoutData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Complete Your Subscription</h1>
          <p className="text-gray-600">
            You're subscribing to the <strong>{plan.name}</strong> plan
          </p>
        </div>

        {/* Checkout Component */}
        <SubscriptionCheckout
          organizationId={checkoutData.organizationId}
          productType={checkoutData.productType as 'web_chat' | 'whatsapp' | 'crm'}
          plan={plan}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          className="shadow-xl"
        />

        {/* Back Link */}
        <div className="mt-8 text-center">
          <button
            onClick={handleCancel}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to plans
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}