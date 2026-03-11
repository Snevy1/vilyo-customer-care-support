'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubscriptionCheckout, SubscriptionPlan } from '@/components/subscriptions/subscription-checkout';
import { Loader2, Globe, Smartphone, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Plan types matching your pricing page
type PlanType = 'webchat' | 'whatsapp' | 'bundle';

// Plans definition matching your seed data
const PLANS: Record<string, SubscriptionPlan> = {
  'P-3AS187416C269694RNGIEDRY': {
    id: 'P-3AS187416C269694RNGIEDRY',
    externalPlanId: 'P-3AS187416C269694RNGIEDRY',
    providerPlanId: 'P-3AS187416C269694RNGIEDRY',
    name: 'Vilyo Support AI (Web Only)',
    slug: 'web-support-basic',
    description: 'Standard web-based chatbot for your website.',
    price: 29, // $29.00 (converted from cents)
    currency: 'USD',
    interval: 'month',
    trialDays: 14,
    features: [
      'Custom Branding',
      'Web Widget',
      'AI Training',
      'Up to 1,000 messages/month',
    ],
    limits: {
      whatsapp_enabled: false,
      webchat_enabled: true,
      max_messages: 1000,
    },
    provider: 'paypal',
    icon: 'Globe',
  },
  'P-0D976339TV311024ENGIETFQ': {
    id: 'P-0D976339TV311024ENGIETFQ',
    externalPlanId: 'P-0D976339TV311024ENGIETFQ',
    providerPlanId: 'P-0D976339TV311024ENGIETFQ',
    name: 'WhatsApp Chatbot Plan',
    slug: 'whatsapp-only',
    description: 'Automate your customer support on WhatsApp.',
    price: 39, // $39.00 (converted from cents)
    currency: 'USD',
    interval: 'month',
    trialDays: 14,
    features: [
      'WhatsApp Integration',
      'Auto-Replies',
      'Contact Sync',
      'Up to 2,000 messages/month',
    ],
    limits: {
      whatsapp_enabled: true,
      webchat_enabled: false,
      max_messages: 2000,
    },
    provider: 'paypal',
    icon: 'Smartphone',
  },
  'P-45V132265G642635JNGIEHGA': {
    id: 'P-45V132265G642635JNGIEHGA',
    externalPlanId: 'P-45V132265G642635JNGIEHGA',
    providerPlanId:'P-45V132265G642635JNGIEHGA',
    name: 'Webchatbot + WhatsApp Bundle',
    slug: 'full-ai-bundle',
    description: 'The complete package for web and mobile support.',
    price: 59, // $59.00 (converted from cents)
    currency: 'USD',
    interval: 'month',
    trialDays: 14,
    features: [
      'Everything in Web + WhatsApp',
      'Priority Support',
      'Analytics',
      'Up to 5,000 messages/month',
    ],
    limits: {
      whatsapp_enabled: true,
      webchat_enabled: true,
      max_messages: 5000,
    },
    provider: 'paypal',
    is_popular: true,
    icon: 'Zap',
  },
};

// Helper to get icon component
const getPlanIcon = (iconName: string) => {
  switch (iconName) {
    case 'Globe':
      return <Globe className="h-5 w-5" />;
    case 'Smartphone':
      return <Smartphone className="h-5 w-5" />;
    case 'Zap':
      return <Zap className="h-5 w-5" />;
    default:
      return null;
  }
};

interface PricingSelection {
  planId: string;
  planType: PlanType;
  price: number;
  name: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [selection, setSelection] = useState<PricingSelection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get plan ID from URL
    const planId = searchParams.get('plan');

    if (!planId) {
      toast.error('No plan selected');
      router.push('/pricing');
      return;
    }

    // Get selection from session storage
    const storedSelection = sessionStorage.getItem('pricing_selection');
    
    if (!storedSelection) {
      toast.error('Session expired. Please select a plan again.');
      router.push('/pricing');
      return;
    }

    try {
      const parsedSelection: PricingSelection = JSON.parse(storedSelection);
      
      // Verify the plan ID matches
      if (parsedSelection.planId !== planId) {
        throw new Error('Plan mismatch');
      }

      const selectedPlan = PLANS[planId];
      
      if (!selectedPlan) {
        throw new Error('Invalid plan');
      }

      setPlan(selectedPlan);
      setSelection(parsedSelection);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Invalid checkout session');
      router.push('/pricing');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, router]);

  const handleSuccess = (subscription: any) => {
    // Clear session storage
    sessionStorage.removeItem('pricing_selection');
    
    // Redirect to success page
    router.push('/dashboard/payment-success?subscription=success');
  };

  const handleCancel = () => {
    // Clear session storage
    sessionStorage.removeItem('pricing_selection');
    
    // Go back to pricing
    router.push('/pricing');
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

  if (!plan || !selection) {
    return null;
  }

  // Get the icon component
  const PlanIcon = plan.icon ? getPlanIcon(plan.icon) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        {/* Header with Plan Info */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className={`
              rounded-full p-3
              ${selection.planType === 'webchat' ? 'bg-blue-100 text-blue-600' : ''}
              ${selection.planType === 'whatsapp' ? 'bg-green-100 text-green-600' : ''}
              ${selection.planType === 'bundle' ? 'bg-yellow-100 text-yellow-600' : ''}
            `}>
              {PlanIcon}
            </div>
          </div>
          
          <h1 className="mb-2 text-3xl font-bold text-zinc-700">Complete Your Subscription</h1>
          <p className="text-gray-600">
            You're subscribing to: <strong className="text-gray-900">{plan.name}</strong>
          </p>
          
          {/* Plan Summary Card */}
          <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium text-zinc-800 text-md">{plan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-xl font-bold text-zinc-800">
                  ${plan.price}<span className="text-sm font-normal text-gray-500">/month</span>
                </p>
              </div>
            </div>
            
            {/* Features Preview */}
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Includes:</p>
              <ul className="grid grid-cols-2 gap-2">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trial Notice */}
          {plan.trialDays && plan.trialDays > 0 && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <span className="font-medium">✨ {plan.trialDays}-day free trial</span>
              {plan.trialDays === 14 && " - Your first 14 days are on us. Cancel anytime."}
              {plan.trialDays === 30 && " - Your first month is free. Cancel anytime."}
            </div>
          )}
        </div>

        {/* Checkout Component */}
        <SubscriptionCheckout
          organizationId="default" // You'll need to get this from your auth context
          productType={selection.planType === 'bundle' ? 'bundle' : selection.planType}
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
            ← Back to pricing
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