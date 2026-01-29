// app/plans/page.tsx
"use client"

import React, { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase/supabase';
import { useRouter } from 'next/navigation';
import { Check, X, Zap, Users, Building } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: Record<string, number>;
}

interface OrganizationSubscription {
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_end?: string;
}

const PlansPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get current user and organization
     // const { data: { user } } = await supabase.auth.getUser();
      //const orgId = user?.user_metadata?.organization_id;
          const response = await fetch("/api/organization/fetch");
          const data = await response.json();
          const organization = data.organization;
          const orgId = organization.id;
          setOrganizationId(orgId);

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (plansError) throw plansError;
      
      // Parse JSON features and limits
      const formattedPlans = plansData.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
        limits: typeof plan.limits === 'object' ? plan.limits : {}
      })) as Plan[];
      
      setPlans(formattedPlans);

      // Fetch current subscription if organization exists
      if (orgId) {
        const { data: subscription, error: subError } = await supabase
          .from('organization_subscriptions')
          .select('plan_id, status, current_period_end')
          .eq('organization_id', orgId)
          .maybeSingle();

          console.log("subscription", subscription);
        if (!subError && subscription) {
          setCurrentPlan(subscription.plan_id);
          setSubscriptionStatus(subscription.status);
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, price: number) => {
    if (!organizationId) {
      alert('Please log in with an organization account.');
      return;
    }

    if (planId === 'free') {
    try {
      // Use API route instead of direct Supabase call
      const response = await fetch('/api/subscriptions/free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate free plan');
      }

      // Update local state
      setCurrentPlan('free');
      setSubscriptionStatus('active');
      
      alert('Free plan activated! You can now connect your CRM.');
      router.refresh();
    } catch (error) {
      console.error('Error activating free plan:', error);
      alert(error instanceof Error ? error.message : 'Failed to activate free plan.');
    }
      
    } else {
      // For paid plans, redirect to Stripe
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
            organizationId,
            billingCycle
          }),
        });

        const data = await response.json();
        
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Failed to create checkout session.');
        }
      } catch (error) {
        console.error('Error creating checkout session:', error);
        alert('Failed to initiate checkout.');
      }
    }
  };

  const handleManageBilling = () => {
    // Redirect to Stripe Customer Portal or your billing page
    window.open('https://billing.stripe.com/session/...', '_blank');
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Users className="h-8 w-8 text-gray-400" />;
      case 'pro': return <Zap className="h-8 w-8 text-blue-500" />;
      case 'enterprise': return <Building className="h-8 w-8 text-purple-500" />;
      default: return <Users className="h-8 w-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'border-gray-200 bg-gray-50';
      case 'pro': return 'border-blue-200 bg-blue-50';
      case 'enterprise': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200';
    }
  };

  const getButtonText = (planId: string) => {
    if (currentPlan === planId) {
      return subscriptionStatus === 'active' ? 'Current Plan' : 'Expired';
    }
    return planId === 'free' ? 'Get Started Free' : 'Subscribe Now';
  };

  const isButtonDisabled = (planId: string) => {
    return currentPlan === planId && subscriptionStatus === 'active';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start with our free plan and upgrade as your team grows. All plans include our core CRM features.
          </p>
          
          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center">
            <div className="relative inline-flex items-center p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Yearly <span className="text-green-600 ml-1">Save 16%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Subscription Banner */}
        {currentPlan && subscriptionStatus && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">
                    Current Plan: <span className="capitalize">{currentPlan}</span>
                    <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                      subscriptionStatus === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {subscriptionStatus}
                    </span>
                  </p>
                  {currentPlan !== 'free' && subscriptionStatus === 'active' && (
                    <button
                      onClick={handleManageBilling}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Manage billing & subscription
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
            const isCurrentPlan = currentPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 ${getPlanColor(plan.id)} p-6 flex flex-col transition-all hover:shadow-lg ${
                  plan.id === 'pro' ? 'scale-105 shadow-xl relative' : ''
                }`}
              >
                {plan.id === 'pro' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      {getPlanIcon(plan.id)}
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    </div>
                    <p className="text-gray-600 mt-1">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      ${billingCycle === 'yearly' && plan.price_yearly > 0 ? plan.price_yearly / 100 : price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && plan.price_yearly > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      ${plan.price_monthly} per month billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  
                  {/* Limits */}
                  {Object.entries(plan.limits).map(([key, value]) => (
                    <li key={key} className="flex items-start">
                      {value === 0 ? (
                        <X className="h-5 w-5 text-gray-300 mr-2 shrink-0 mt-0.5" />
                      ) : (
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      )}
                      <span className="text-gray-700">
                        {value === 0 ? 'No' : value === 999999 ? 'Unlimited' : value} {key}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id, price)}
                  disabled={isButtonDisabled(plan.id)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    isCurrentPlan && subscriptionStatus === 'active'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.id === 'pro'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : plan.id === 'enterprise'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {getButtonText(plan.id)}
                </button>

                {plan.id === 'free' && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    No credit card required
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-lg mb-2">Can I switch plans later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade at any time. When upgrading, you'll be charged the prorated difference. Downgrading takes effect at the next billing cycle.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-lg mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">
                We offer a 14-day money-back guarantee on paid plans. If you're not satisfied, contact our support team within 14 days of purchase for a full refund.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-lg mb-2">What happens when I reach my limits?</h3>
              <p className="text-gray-600">
                You'll receive notifications as you approach your limits. Once reached, you'll need to upgrade to continue adding new records. Existing data remains accessible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;