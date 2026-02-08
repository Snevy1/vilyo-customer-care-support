"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WhatsAppPlan {
  id: string;
  plan_id: string;
  name: string;
  display_name: string;
  description: string;
  price: number; // In dollars
  currency: string;
  billing_interval: string;
  trial_period_days: number;
  features: string[];
  limits: Record<string, any>;
  max_chats_per_month?: number;
  max_agents?: number;
  ai_automation?: boolean;
  is_active: boolean;
  is_default: boolean;
}

interface WhatsAppPlanSelectionProps {
  organizationId: string;
  organizationName: string;
  userEmail: string;
  onBack?: () => void;
}

export default function WhatsAppPlanSelection({
  organizationId,
  organizationName,
  userEmail,
  onBack
}: WhatsAppPlanSelectionProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingPlans, setFetchingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<WhatsAppPlan[]>([]);
  
  // Fetch plans on component mount
  useEffect(() => {
    fetchWhatsAppPlans();
  }, []);

  // Auto-select default plan once plans are loaded
  useEffect(() => {
    if (plans.length > 0) {
      const defaultPlan = plans.find(plan => plan.is_default);
      if (defaultPlan) {
        setSelectedPlan(defaultPlan.plan_id);
      } else if (plans[0]) {
        setSelectedPlan(plans[0].plan_id);
      }
    }
  }, [plans]);

  const fetchWhatsAppPlans = async () => {
    try {
      setFetchingPlans(true);
      setError(null);
      
      // Hardcoded URL for now - adjust later
      const response = await fetch('/api/admin/subscriptions/plans/whatsapp?activeOnly=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load plans');
      }

      console.log('data', data)

      setPlans(data.data || []);
      
    } catch (err: any) {
      console.error("Error fetching WhatsApp plans:", err);
      setError(`Unable to load plans: ${err.message}`);
      
      // Fallback to static plans if API fails
      setPlans(getStaticPlans());
    } finally {
      setFetchingPlans(false);
    }
  };

  // Static fallback plans in case API fails
  const getStaticPlans = (): WhatsAppPlan[] => [
    {
      id: '1',
      plan_id: 'whatsapp_free_trial',
      name: 'Free Trial',
      display_name: '14-Day Free Trial',
      description: '14-day free trial with basic features',
      price: 0,
      currency: 'USD',
      billing_interval: 'month',
      trial_period_days: 14,
      features: [
        'Up to 100 messages/month',
        'Basic AI responses',
        'Single WhatsApp number',
        'Email support'
      ],
      limits: {
        messages_per_month: 100,
        whatsapp_numbers: 1
      },
      is_active: true,
      is_default: true
    },
    {
      id: '2',
      plan_id: 'whatsapp_basic',
      name: 'Basic',
      display_name: 'Basic Plan',
      description: 'For small businesses',
      price: 49,
      currency: 'USD',
      billing_interval: 'month',
      trial_period_days: 0,
      features: [
        'Up to 1,000 messages/month',
        'Advanced AI responses',
        'Single WhatsApp number',
        'Priority support',
        'Basic analytics'
      ],
      limits: {
        messages_per_month: 1000,
        whatsapp_numbers: 1
      },
      is_active: true,
      is_default: false
    },
    {
      id: '3',
      plan_id: 'whatsapp_pro',
      name: 'Professional',
      display_name: 'Professional Plan',
      description: 'For growing businesses',
      price: 99,
      currency: 'USD',
      billing_interval: 'month',
      trial_period_days: 0,
      features: [
        'Up to 5,000 messages/month',
        'Custom AI training',
        'Multiple WhatsApp numbers',
        '24/7 priority support',
        'Advanced analytics',
        'Custom integrations'
      ],
      limits: {
        messages_per_month: 5000,
        whatsapp_numbers: 3
      },
      is_active: true,
      is_default: false
    }
  ];

  const handleSubmit = async () => {
    if (!selectedPlan) {
      setError('Please select a plan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          organization_id: organizationId,
          organization_name: organizationName,
          email: userEmail,
          plan_id: selectedPlan
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to initialize setup');
        return;
      }

      // Redirect to WhatsApp setup URL
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        // If no redirect URL, show success message
        setError('Setup initiated successfully! Please check your dashboard.');
        // Optionally redirect after delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error("Plan selection error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPlanDetails = () => {
    return plans.find(plan => plan.plan_id === selectedPlan);
  };

  const selectedPlanDetails = getSelectedPlanDetails();

  // Loading state
  if (fetchingPlans) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Choose Your WhatsApp Plan</h1>
          <p className="text-gray-600 mt-2">Loading available plans...</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
              <div className="h-4 bg-gray-200 rounded mb-6 w-5/6"></div>
              <div className="space-y-2 mb-6">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-3 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your WhatsApp Plan</h1>
        <p className="text-gray-600 mt-2">
          Select the plan that best fits your business needs. You can upgrade at any time.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          {!error.includes('Unable to load plans') && (
            <button 
              onClick={fetchWhatsAppPlans}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try loading plans again
            </button>
          )}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No plans available at the moment.</p>
          <button 
            onClick={fetchWhatsAppPlans}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => (
              <div
                key={plan.plan_id}
                className={`border rounded-xl p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.plan_id
                    ? 'border-blue-500 bg-blue-50 text-zinc-700 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan(plan.plan_id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.display_name || plan.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ${plan.price}
                      <span className="text-sm font-normal text-gray-500">/{plan.billing_interval}</span>
                    </div>
                    {plan.trial_period_days > 0 && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        {plan.trial_period_days}-day free trial
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Plan limits summary */}
                {plan.limits && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      {plan.limits.messages_per_month && (
                        <span>Up to {plan.limits.messages_per_month.toLocaleString()} messages/month</span>
                      )}
                      {plan.limits.whatsapp_numbers && (
                        <span>{plan.limits.whatsapp_numbers} WhatsApp number{plan.limits.whatsapp_numbers > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                )}
                
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-green-500 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className='text-gray-800'>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-medium ${
                    selectedPlan === plan.plan_id
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.plan_id);
                  }}
                >
                  {selectedPlan === plan.plan_id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center border-t pt-6">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              Back
            </button>
            
            <div className="text-right">
              {selectedPlanDetails && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    Selected: <span className="font-bold text-gray-900">{selectedPlanDetails.display_name || selectedPlanDetails.name}</span>
                  </p>
                  <div className="text-sm text-gray-500 mt-1">
                    {selectedPlanDetails.price === 0 ? (
                      <span>Free plan - no payment required</span>
                    ) : (
                      <span>
                        ${selectedPlanDetails.price}/{selectedPlanDetails.billing_interval}
                        {selectedPlanDetails.trial_period_days > 0 && (
                          <span className="text-green-600 ml-2">
                            • {selectedPlanDetails.trial_period_days}-day free trial
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedPlan}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  'Continue to WhatsApp Setup'
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}