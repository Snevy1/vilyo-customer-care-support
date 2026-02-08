"use client";

import  { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Users, Zap, Globe } from 'lucide-react';
import { WebChatPlan, WebChatPlanSelectionProps } from '@/@types/types';



export default function WebChatPlanSelection({
  organizationId,
  organizationName,
  userEmail,
  onBack
}: WebChatPlanSelectionProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingPlans, setFetchingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<WebChatPlan[]>([]);
  
  // Fetch plans on component mount
  useEffect(() => {
    fetchWebChatPlans();
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

  const fetchWebChatPlans = async () => {
    try {
      setFetchingPlans(true);
      setError(null);
      
      // Fetch webchat plans from API
      const response = await fetch('/api/admin/subscriptions/plans/webchat?activeOnly=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load plans');
      }

      setPlans(data.data || []);
      
    } catch (err: any) {
      console.error("Error fetching WebChat plans:", err);
      setError(`Unable to load plans: ${err.message}`);
      
      // Fallback to static plans if API fails
      setPlans(getStaticPlans());
    } finally {
      setFetchingPlans(false);
    }
  };

  // Static fallback plans in case API fails
  const getStaticPlans = (): WebChatPlan[] => [
    {
      id: '1',
      plan_id: 'webchat_free',
      name: 'Free',
      display_name: 'Free Forever',
      description: 'Basic web chat for small websites',
      price: 0,
      currency: 'USD',
      billing_interval: 'month',
      trial_period_days: 0,
      features: [
        'Up to 100 chats/month',
        'Basic chat widget',
        '1 agent seat',
        'Email support',
        '7-day chat history',
        'Basic analytics'
      ],
      limits: {
        max_chats_per_month: 100,
        max_agents: 1,
        ai_automation: false,
        custom_branding: false,
        custom_domains: 1
      },
      integrations: ['basic'],
      max_chats_per_month: 100,
      max_agents: 1,
      ai_automation: false,
      custom_branding: false,
      custom_domains: 1,
      is_active: true,
      is_default: true
    },
    {
      id: '2',
      plan_id: 'webchat_starter',
      name: 'Starter',
      display_name: 'Starter Plan',
      description: 'Perfect for small businesses and startups',
      price: 29,
      currency: 'USD',
      billing_interval: 'month',
      trial_period_days: 14,
      features: [
        'Up to 1,000 chats/month',
        'Customizable chat widget',
        '3 agent seats',
        'Priority support',
        '30-day chat history',
        'Advanced analytics',
        'File sharing',
        'AI chatbot responses'
      ],
      limits: {
        max_chats_per_month: 1000,
        max_agents: 3,
        ai_automation: true,
        custom_branding: true,
        custom_domains: 1
      },
      integrations: ['slack', 'email', 'basic'],
      max_chats_per_month: 1000,
      max_agents: 3,
      ai_automation: true,
      custom_branding: true,
      custom_domains: 1,
      is_active: true,
      is_default: false
    },
    {
      id: '3',
      plan_id: 'webchat_pro',
      name: 'Professional',
      display_name: 'Professional Plan',
      description: 'For growing businesses with multiple teams',
      price: 79,
      currency: 'USD',
      billing_interval: 'month',
      trial_period_days: 14,
      features: [
        'Up to 5,000 chats/month',
        'Fully customizable widget',
        '10 agent seats',
        '24/7 priority support',
        'Unlimited chat history',
        'Advanced AI automation',
        'Custom domains',
        'Team collaboration',
        'API access',
        'Zapier integration'
      ],
      limits: {
        max_chats_per_month: 5000,
        max_agents: 10,
        ai_automation: true,
        custom_branding: true,
        custom_domains: 3
      },
      integrations: ['slack', 'teams', 'zapier', 'api', 'webhooks'],
      max_chats_per_month: 5000,
      max_agents: 10,
      ai_automation: true,
      custom_branding: true,
      custom_domains: 3,
      is_active: true,
      is_default: false
    },
    {
      id: '4',
      plan_id: 'webchat_enterprise',
      name: 'Enterprise',
      display_name: 'Enterprise Plan',
      description: 'For large organizations with custom needs',
      price: 199,
      currency: 'USD',
      billing_interval: 'month',
      trial_period_days: 30,
      features: [
        'Unlimited chats',
        'Unlimited agent seats',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom AI training',
        'Unlimited custom domains',
        'SSO integration',
        'Custom SLA',
        'Advanced security',
        'Custom integrations',
        'On-premise deployment option'
      ],
      limits: {
        max_chats_per_month: null,
        max_agents: null,
        ai_automation: true,
        custom_branding: true,
        custom_domains: null
      },
      integrations: ['all'],
      max_chats_per_month: undefined,
      max_agents: undefined,
      ai_automation: true,
      custom_branding: true,
      custom_domains: undefined,
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
      const response = await fetch('/api/webchat/subscribe', {
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
        setError(data.error || 'Failed to subscribe to WebChat');
        return;
      }

      if (data.url) {
        // Redirect to payment page if needed
        window.location.href = data.url;
      } else if (data.success) {
        // If free plan or immediate activation
        setError('WebChat setup successful! You can now configure your chat widget.');
        // Redirect to dashboard after delay
        setTimeout(() => {
          router.push('/dashboard/webchat/setup');
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Choose Your WebChat Plan</h1>
          <p className="text-gray-600 mt-2">Loading available plans...</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
              <div className="h-4 bg-gray-200 rounded mb-6 w-5/6"></div>
              <div className="space-y-2 mb-6">
                {[1, 2, 3, 4, 5].map((j) => (
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">WebChat Live Chat Solution</h1>
        </div>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Add live chat to your website to engage visitors, capture leads, and provide instant support.
          Choose the plan that matches your traffic and team size.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          {!error.includes('Unable to load plans') && (
            <button 
              onClick={fetchWebChatPlans}
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
            onClick={fetchWebChatPlans}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {plans.map((plan) => (
              <div
                key={plan.plan_id}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all h-full flex flex-col ${
                  selectedPlan === plan.plan_id
                    ? 'border-blue-500 bg-blue-50 text-zinc-700 ring-2 ring-blue-200 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan(plan.plan_id)}
              >
                {plan.plan_id === 'webchat_pro' && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      POPULAR
                    </span>
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.display_name || plan.name}</h3>
                  <p className="text-gray-600 text-sm mt-1 h-12">{plan.description}</p>
                </div>
                
                <div className="text-right mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    ${plan.price}
                    <span className="text-sm font-normal text-gray-500">/{plan.billing_interval}</span>
                  </div>
                  {plan.trial_period_days > 0 ? (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      {plan.trial_period_days}-day free trial
                    </div>
                  ) : plan.price === 0 ? (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      Free forever
                    </div>
                  ) : null}
                </div>
                
                {/* Plan limits summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-gray-500" />
                      Chats/month:
                    </span>
                    <span className="font-medium">
                      {plan.max_chats_per_month === null ? 'Unlimited' : plan.max_chats_per_month?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-gray-500" />
                      Agent seats:
                    </span>
                    <span className="font-medium">
                      {plan.max_agents === null ? 'Unlimited' : plan.max_agents}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-gray-500" />
                      Domains:
                    </span>
                    <span className="font-medium">
                      {plan.custom_domains === null ? 'Unlimited' : plan.custom_domains}
                    </span>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-6 grow">
                  {plan.features.slice(0, 5).map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <svg className="w-4 h-4 text-green-500 mr-2 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-xs text-gray-500">
                      + {plan.features.length - 5} more features
                    </li>
                  )}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-medium mt-auto ${
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

          {/* Comparison Table */}
          <div className="mb-8 overflow-x-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Plan Comparison</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.plan_id} className="text-center py-3 px-4 font-medium text-gray-700">
                      {plan.display_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 text-gray-600">Monthly chats</td>
                  {plans.map(plan => (
                    <td key={plan.plan_id} className="text-center py-3 px-4">
                      {plan.max_chats_per_month === null ? 'Unlimited' : plan.max_chats_per_month?.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-gray-600">Agent seats</td>
                  {plans.map(plan => (
                    <td key={plan.plan_id} className="text-center py-3 px-4">
                      {plan.max_agents === null ? 'Unlimited' : plan.max_agents}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-gray-600">AI Automation</td>
                  {plans.map(plan => (
                    <td key={plan.plan_id} className="text-center py-3 px-4">
                      {plan.ai_automation ? '✓' : '✗'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-gray-600">Custom Branding</td>
                  {plans.map(plan => (
                    <td key={plan.plan_id} className="text-center py-3 px-4">
                      {plan.custom_branding ? '✓' : '✗'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-gray-600">Support</td>
                  {plans.map(plan => (
                    <td key={plan.plan_id} className="text-center py-3 px-4">
                      {plan.plan_id.includes('enterprise') ? '24/7 Phone' : 
                       plan.plan_id.includes('pro') ? '24/7 Priority' :
                       plan.plan_id.includes('starter') ? 'Priority' : 'Email'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center border-t pt-8">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              Back
            </button>
            
            <div className="text-right">
              {selectedPlanDetails && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-gray-700">
                    Selected: <span className="font-bold text-gray-900">{selectedPlanDetails.display_name || selectedPlanDetails.name}</span>
                  </p>
                  <div className="text-sm text-gray-600 mt-2">
                    {selectedPlanDetails.price === 0 ? (
                      <div>
                        <span className="font-medium">Free plan - no payment required</span>
                        <p className="text-xs mt-1">Get started immediately with basic features</p>
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium">
                          ${selectedPlanDetails.price}/{selectedPlanDetails.billing_interval}
                          {selectedPlanDetails.trial_period_days > 0 && (
                            <span className="text-green-600 ml-2">
                              • {selectedPlanDetails.trial_period_days}-day free trial included
                            </span>
                          )}
                        </span>
                        <p className="text-xs mt-1">Billed monthly, cancel anytime</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-sm text-gray-600">Need help deciding?</p>
                  <a href="/contact" className="text-blue-600 hover:text-blue-800 text-sm">
                    Contact sales for a demo →
                  </a>
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedPlan}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : selectedPlanDetails?.price === 0 ? (
                    'Activate Free Plan'
                  ) : (
                    'Continue to Payment'
                  )}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}