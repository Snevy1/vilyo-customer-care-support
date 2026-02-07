

"use client";

import {  Zap, MessageSquare, Database } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plan, SelectedPlan } from '@/@types/types';
import { PricingCard } from './pricingCard';
import { ProductSection } from './productSection';
import { FAQItem } from './faqItem';



export default function Pricing() {
  const router = useRouter();
  const [selectedPlans, setSelectedPlans] = useState<SelectedPlan>({});
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Mock CRM plans (static for now)
  const crmPlans = [
    {
      id: '1',
      plan_id: 'crm_free',
      name: 'Free',
      display_name: 'Free CRM',
      description: 'Basic CRM for small businesses',
      price: 0,
      currency: 'USD',
      billing_interval: 'month',
      features: [
        'Up to 50 contacts',
        'Basic contact management',
        'Email support',
        'Simple pipeline'
      ],
      product_type: 'crm' as const,
      is_default: true
    },
    {
      id: '2',
      plan_id: 'crm_pro',
      name: 'Professional',
      display_name: 'Professional CRM',
      description: 'Advanced CRM for growing teams',
      price: 49,
      currency: 'USD',
      billing_interval: 'month',
      features: [
        'Up to 1,000 contacts',
        'Advanced analytics',
        'Priority support',
        'Custom pipelines',
        'API access'
      ],
      product_type: 'crm' as const,
      is_popular: true
    },
    {
      id: '3',
      plan_id: 'crm_enterprise',
      name: 'Enterprise',
      display_name: 'Enterprise CRM',
      description: 'Full-featured CRM for large organizations',
      price: 99,
      currency: 'USD',
      billing_interval: 'month',
      features: [
        'Unlimited contacts',
        'Custom reporting',
        '24/7 phone support',
        'SSO integration',
        'Custom workflows'
      ],
      product_type: 'crm' as const
    }
  ];

  // Bundle plans (static)
  const bundlePlans = [
    {
      id: 'bundle_starter',
      plan_id: 'bundle_starter',
      name: 'Business Starter',
      display_name: 'Business Starter Bundle',
      description: 'Everything you need to get started',
      price: 79,
      currency: 'USD',
      billing_interval: 'month',
      features: [
        'WebChat Starter Plan',
        'WhatsApp Basic Plan',
        'CRM Professional Plan',
        'Unified dashboard',
        'Priority support'
      ],
      product_type: 'bundle' as const,
      savings: 30 // Percentage saved
    },
    {
      id: 'bundle_pro',
      plan_id: 'bundle_pro',
      name: 'Business Pro',
      display_name: 'Business Pro Bundle',
      description: 'Complete suite for growing businesses',
      price: 149,
      currency: 'USD',
      billing_interval: 'month',
      features: [
        'WebChat Professional Plan',
        'WhatsApp Professional Plan',
        'CRM Enterprise Plan',
        'Advanced analytics',
        '24/7 dedicated support',
        'Custom integrations'
      ],
      product_type: 'bundle' as const,
      is_popular: true,
      savings: 40
    }
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [selectedPlans, plans]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      
      // Fetch WebChat and WhatsApp plans from APIs
      const [webchatResponse, whatsappResponse] = await Promise.all([
        fetch('/api/admin/subscriptions/plans/webchatbot?activeOnly=true').then(res => res.json()),
        fetch('/api/admin/subscriptions/plans/whatsapp?activeOnly=true').then(res => res.json())
      ]);

      const allPlans: Plan[] = [
        ...(webchatResponse.success ? webchatResponse.data.map((plan: any) => ({
          ...plan,
          product_type: 'webchat' as const
        })) : []),
        ...(whatsappResponse.success ? whatsappResponse.data.map((plan: any) => ({
          ...plan,
          product_type: 'whatsapp' as const
        })) : []),
        ...crmPlans,
        ...bundlePlans
      ];
      setPlans(allPlans);
      
      // Auto-select default plans for each category
      const defaults: SelectedPlan = {};
      allPlans.forEach(plan => {
        if (plan.is_default) {
          if (plan.product_type === 'webchat') defaults.webchat = plan.plan_id;
          if (plan.product_type === 'whatsapp') defaults.whatsapp = plan.plan_id;
          if (plan.product_type === 'crm') defaults.crm = plan.plan_id;
        }
      });
      setSelectedPlans(defaults);
      
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback to static plans
      setPlans([...crmPlans, ...bundlePlans]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Calculate individual plans total
    Object.entries(selectedPlans).forEach(([productType, planId]) => {
      if (productType === 'bundle') {
        // Bundle includes everything, so reset and use bundle price
        const bundlePlan = plans.find(p => p.plan_id === planId);
        if (bundlePlan) total = bundlePlan.price;
      } else if (productType !== 'bundle') {
        const plan = plans.find(p => p.plan_id === planId);
        if (plan) total += plan.price;
      }
    });
    
    setTotalPrice(total);
  };

  const handlePlanSelect = (productType: keyof SelectedPlan, planId: string) => {
    setSelectedPlans(prev => {
      const newSelection = { ...prev };
      
      // If selecting a bundle, deselect individual plans
      if (productType === 'bundle') {
        delete newSelection.webchat;
        delete newSelection.whatsapp;
        delete newSelection.crm;
        newSelection.bundle = planId;
      } else {
        // If selecting individual plan, remove bundle selection
        delete newSelection.bundle;
        newSelection[productType] = planId;
      }
      
      return newSelection;
    });
  };

  const handleGetStarted = async () => {
    // Check if user is logged in
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated) {
      // Store selections in localStorage and redirect to login
      localStorage.setItem('pricing_selections', JSON.stringify(selectedPlans));
      router.push('/login?redirect=/checkout');
      return;
    }
    
    // Redirect to checkout with selections
    router.push(`/checkout?selections=${encodeURIComponent(JSON.stringify(selectedPlans))}`);
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check');
      return response.ok;
    } catch {
      return false;
    }
  };

  const getPlansByProduct = (productType: string) => {
    return plans.filter(plan => plan.product_type === productType);
  };

  const getSelectedPlanName = (productType: keyof SelectedPlan) => {
    const planId = selectedPlans[productType];
    if (!planId) return 'Not selected';
    const plan = plans.find(p => p.plan_id === planId);
    return plan?.display_name || plan?.name || 'Unknown';
  };

  if (loading) {
    return (
      <section id='pricing' className='py-32 px-6 max-w-7xl mx-auto text-center'>
        <h2 className='text-3xl md:text-4xl font-medium text-white tracking-tight mb-4'>
          Loading Plans...
        </h2>
        <p className='text-zinc-500 font-light mb-16'>
          Please wait while we load our pricing options
        </p>
      </section>
    );
  }

  return (
    <section id='pricing' className='py-32 px-6 max-w-7xl mx-auto'>
      <div className='text-center mb-16'>
        <h2 className='text-3xl md:text-4xl font-medium text-white tracking-tight'>
          Choose Your Perfect Plan
        </h2>
        <p className='text-zinc-500 font-light mt-4 max-w-2xl mx-auto'>
          Mix and match plans across our products, or choose a bundle for maximum savings.
          Start with any product and add more as you grow.
        </p>
      </div>

      {/* Bundle Plans Section */}
      <div className='mb-16'>
        <div className='flex items-center gap-3 mb-8'>
          <Zap className='w-6 h-6 text-yellow-500' />
          <h3 className='text-2xl font-medium text-white'>Bundle & Save</h3>
          <span className='ml-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full'>
            Recommended
          </span>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
          {getPlansByProduct('bundle').map((plan) => (
            <PricingCard
              key={plan.plan_id}
              plan={plan}
              isSelected={selectedPlans.bundle === plan.plan_id}
              onSelect={() => handlePlanSelect('bundle', plan.plan_id)}
              highlightColor='yellow'
              showSavings={(plan as any).savings}
            />
          ))}
        </div>
      </div>

      {/* Individual Products Section */}
      <div className='mb-16'>
        <h3 className='text-2xl font-medium text-white mb-8'>Or Build Your Own Package</h3>
        
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* WebChat Plans */}
          <ProductSection
            title="WebChat"
            description="Live chat for your website"
            icon={<MessageSquare className='w-5 h-5' />}
            plans={getPlansByProduct('webchat')}
            selectedPlanId={selectedPlans.webchat}
            onSelect={(planId) => handlePlanSelect('webchat', planId)}
            color="blue"
          />
          
          {/* WhatsApp Plans */}
          <ProductSection
            title="WhatsApp"
            description="Business messaging platform"
            icon={<MessageSquare className='w-5 h-5' />}
            plans={getPlansByProduct('whatsapp')}
            selectedPlanId={selectedPlans.whatsapp}
            onSelect={(planId) => handlePlanSelect('whatsapp', planId)}
            color="green"
          />
          
          {/* CRM Plans */}
          <ProductSection
            title="CRM"
            description="Customer relationship management"
            icon={<Database className='w-5 h-5' />}
            plans={getPlansByProduct('crm')}
            selectedPlanId={selectedPlans.crm}
            onSelect={(planId) => handlePlanSelect('crm', planId)}
            color="purple"
          />
        </div>
      </div>

      {/* Selection Summary */}
      <div className='bg-zinc-900/50 border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto'>
        <div className='flex flex-col md:flex-row justify-between items-center gap-6'>
          <div>
            <h4 className='text-xl font-medium text-white mb-2'>Your Selection</h4>
            <div className='text-zinc-400 space-y-1'>
              {selectedPlans.bundle ? (
                <p className='flex items-center gap-2'>
                  <Zap className='w-4 h-4 text-yellow-500' />
                  {getSelectedPlanName('bundle')} Bundle
                </p>
              ) : (
                <>
                  {selectedPlans.webchat && (
                    <p>WebChat: {getSelectedPlanName('webchat')}</p>
                  )}
                  {selectedPlans.whatsapp && (
                    <p>WhatsApp: {getSelectedPlanName('whatsapp')}</p>
                  )}
                  {selectedPlans.crm && (
                    <p>CRM: {getSelectedPlanName('crm')}</p>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className='text-right'>
            <div className='text-3xl font-medium text-white mb-1'>
              ${totalPrice}<span className='text-lg text-zinc-400 font-light'>/month</span>
            </div>
            <p className='text-zinc-500 text-sm'>
              {selectedPlans.bundle ? 'Everything included' : 'Custom package'}
            </p>
          </div>
          
          <button
            onClick={handleGetStarted}
            className='bg-white text-black px-8 py-3 rounded-xl hover:bg-zinc-200 transition-colors text-sm font-medium cursor-pointer w-full md:w-auto'
            disabled={!selectedPlans.bundle && !selectedPlans.webchat && !selectedPlans.whatsapp && !selectedPlans.crm}
          >
            Continue to Checkout
          </button>
        </div>
        
        <p className='text-center text-zinc-500 text-sm mt-6'>
          Need help choosing?{' '}
          <Link href="/contact" className='text-white hover:underline'>
            Contact our sales team
          </Link>
        </p>
      </div>

      {/* FAQ Section */}
      <div className='mt-16 max-w-3xl mx-auto'>
        <h4 className='text-xl font-medium text-white mb-6 text-center'>Frequently Asked Questions</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <FAQItem
            question="Can I mix free and paid plans?"
            answer="Yes! You can select a free plan for one product and a paid plan for another. For example, use WebChat free with WhatsApp Pro."
          />
          <FAQItem
            question="Can I upgrade or downgrade later?"
            answer="Absolutely. You can change your plan for any product at any time. Changes are prorated."
          />
          <FAQItem
            question="Do you offer discounts for yearly billing?"
            answer="Yes, we offer 20% discount for annual billing on all paid plans. Contact us for enterprise discounts."
          />
          <FAQItem
            question="Is there a setup fee?"
            answer="No setup fees. You only pay for the plans you select on a monthly basis."
          />
        </div>
      </div>
    </section>
  );
}

// Sub-components































// Pricing page before


/* import { Check } from 'lucide-react'
import React from 'react'

const Pricing = () => {
  return (
    <section id='pricing' className='py-32 px-6 max-w-6xl mx-auto text-center'>

        <h2 className='text-3xl md:text-4xl font-medium text-white tracking-tight'>
            Fair, usage-based pricing.
        </h2>

        <p className='text-zinc-500 font-light mb-16'>
            Start free, upgrade as you grow.
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto'>

            <div className='p-8 rounded-3xl border border-white/5 bg-zinc-900/20 flex flex-col items-start text-left hover:bg-zinc-900/40 transition-colors'>
            <div className='text-sm font-medium text-zinc-400 mb-2'>Starter</div>

            <div className='text-4xl font-medium text-white tracking-tight mb-6'>
                $0 <span className='text-lg text-zinc-600 font-light'>/mo</span>

            </div>
            <ul className='space-y-3 mb-8 text-sm text-zinc-300 font-light'>
               <li className='flex items-center gap-3'>
                <Check className='w-4 h-4 text-zinc-600'/> 100 conversations/month
               </li>
               <li className='flex items-center gap-3'> 

                <Check className='w-4 h-4 text-zinc-600'/> 1 Knowledge source
               </li>

               <li className='flex items-center gap-3'> 
                <Check className='w-4 h-4 text-zinc-600'/> Community Support
               </li>

               
            </ul>
            <button className='w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium mt-auto cursor-pointer '>
                Start Free
            </button>

            </div>

            <div className='p-8 relative overflow-hidden rounded-3xl bg-white/3 border border-white/10   flex flex-col items-start text-left hover:bg-zinc-900/40 transition-colors'>
            <div className=' absolute top-0 right-0 px-4 py-1 bg-white/10 rounded-b-md  text-sm font-medium text-zinc-400 mb-2'>Popular</div>
            <div className='text-sm font-medium text-indigo-400 mb-2'>Pro</div>

            <div className='text-4xl font-medium text-white tracking-tight mb-6'>
                $39 <span className='text-lg text-zinc-400 font-light'>/mo</span>

            </div>
            <ul className='space-y-3 mb-8 text-sm text-zinc-300 font-light'>
               <li className='flex items-center gap-3'>
                <Check className='w-4 h-4 text-indigo-400'/> unlimited conversations
               </li>
               <li className='flex items-center gap-3'> 

                <Check className='w-4 h-4 text-indigo-400'/> unlimited Knowledge Sources
               </li>

               <li className='flex items-center gap-3'> 
                <Check className='w-4 h-4 text-indigo-400'/> Community Support
               </li>
               <li className='flex items-center gap-3'> 
                <Check className='w-4 h-4 text-indigo-400'/> Custom Branding
               </li>

               
            </ul>
            <button className='w-full bg-white text-black py-3 rounded-xl border border-white/10  hover:bg-zinc-200 transition-colors text-sm font-medium mt-auto cursor-pointer '>
                Get Started
            </button>

            </div>

        </div>

    </section>
  )
}

export default Pricing */