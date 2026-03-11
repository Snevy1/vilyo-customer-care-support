
"use client";

import { Zap, MessageSquare, Smartphone, Globe } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PricingCard } from './pricingCard';
import { FAQItem } from './faqItem';

// Types matching your database schema
interface Plan {
  id?: string;
  name: string;
  slug: string;
  description: string;
  productId?: string;
  externalPlanId: string;
  price: number; // in cents
  provider: 'paypal' | 'stripe';
  limits: {
    whatsapp_enabled: boolean;
    webchat_enabled: boolean;
    max_messages?: number;
  };
  features: string[];
  is_popular?: boolean;
  is_default?: boolean;
}

interface SelectedPlan {
  webchat?: string;
  whatsapp?: string;
  bundle?: string;
}

export default function Pricing() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'webchat' | 'whatsapp' | 'bundle'>('webchat');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Static plans matching your seed data
  const staticPlans: Plan[] = [
    {
      name: "Vilyo Support AI (Web Only)",
      slug: "web-support-basic",
      description: "Standard web-based chatbot for your website.",
      productId: "PROD-10349113AH7231608",
      externalPlanId: "P-3AS187416C269694RNGIEDRY",
      price: 2900, // $29.00
      provider: "paypal",
      limits: {
        whatsapp_enabled: false,
        webchat_enabled: true,
        max_messages: 1000,
      },
      features: ["Custom Branding", "Web Widget", "AI Training"],
      is_default: true
    },
    {
      name: "WhatsApp Chatbot Plan",
      slug: "whatsapp-only",
      description: "Automate your customer support on WhatsApp.",
      productId: "PROD-10349113AH7231608",
      externalPlanId: "P-0D976339TV311024ENGIETFQ",
      price: 3900, // $39.00
      provider: "paypal",
      limits: {
        whatsapp_enabled: true,
        webchat_enabled: false,
        max_messages: 2000,
      },
      features: ["WhatsApp Integration", "Auto-Replies", "Contact Sync"],
    },
    {
      name: "Webchatbot + WhatsApp Bundle",
      slug: "full-ai-bundle",
      description: "The complete package for web and mobile support.",
      productId: "PROD-10349113AH7231608",
      externalPlanId: "P-45V132265G642635JNGIEHGA",
      price: 5900, // $59.00
      provider: "paypal",
      limits: {
        whatsapp_enabled: true,
        webchat_enabled: true,
        max_messages: 5000,
      },
      features: ["Everything in Web + WhatsApp", "Priority Support", "Analytics"],
      is_popular: true
    },
  ];

  useEffect(() => {
    setPlans(staticPlans);
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [selectedPlan, plans]);

  const calculateTotal = () => {
    const plan = plans.find(p => {
      if (selectedPlan === 'webchat') return p.slug === 'web-support-basic';
      if (selectedPlan === 'whatsapp') return p.slug === 'whatsapp-only';
      return p.slug === 'full-ai-bundle';
    });
    
    if (plan) {
      setTotalPrice(plan.price / 100); // Convert cents to dollars
    }
  };

  const handlePlanSelect = (planType: 'webchat' | 'whatsapp' | 'bundle') => {
    setSelectedPlan(planType);
  };

  const handleGetStarted = async () => {
    const isAuthenticated = await checkAuth();
    
    // Find the selected plan
    const selectedPlanData = plans.find(p => {
      if (selectedPlan === 'webchat') return p.slug === 'web-support-basic';
      if (selectedPlan === 'whatsapp') return p.slug === 'whatsapp-only';
      return p.slug === 'full-ai-bundle';
    });

    if (!selectedPlanData) return;
    
    const selection = {
      planId: selectedPlanData.externalPlanId,
      planType: selectedPlan,
      price: selectedPlanData.price,
      name: selectedPlanData.slug
    };
    
    if (!isAuthenticated) {
      sessionStorage.setItem('pricing_selection', JSON.stringify(selection));
      router.push('/api/auth?redirect=/checkout');
      return;
    }

    sessionStorage.setItem('pricing_selection', JSON.stringify(selection));
    router.push(`/checkout?plan=${selectedPlanData.externalPlanId}`);
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      return data.authenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  };

  const getPlanByType = (type: 'webchat' | 'whatsapp' | 'bundle') => {
    return plans.find(p => {
      if (type === 'webchat') return p.slug === 'web-support-basic';
      if (type === 'whatsapp') return p.slug === 'whatsapp-only';
      return p.slug === 'full-ai-bundle';
    });
  };

  const formatPrice = (priceInCents: number): number => {
  // Converts string back to number
  return Number((priceInCents / 100).toFixed(2)); 
};


  const webchatPlan = getPlanByType('webchat');
  const whatsappPlan = getPlanByType('whatsapp');
  const bundlePlan = getPlanByType('bundle');

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
          Choose Your Plan
        </h2>
        <p className='text-zinc-500 font-light mt-4 max-w-2xl mx-auto'>
          Select the perfect plan for your business needs. Start with web-only, 
          WhatsApp-only, or get both with our bundle.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16'>
        {/* Web Only Plan */}
        {webchatPlan && (
          <PricingCard
            key={webchatPlan.externalPlanId}
            plan={{
              ...webchatPlan,
              price: formatPrice(webchatPlan.price),
              display_name: webchatPlan.name,
              plan_id: webchatPlan.externalPlanId,
              currency:'USD',
              billing_interval: 'Monthly',
               product_type: "webchat"
            }}
            isSelected={selectedPlan === 'webchat'}
            onSelect={() => handlePlanSelect('webchat')}
            highlightColor='blue'
            icon={<Globe className='w-6 h-6' />}
          />
        )}

        {/* WhatsApp Only Plan */}
        {whatsappPlan && (
          <PricingCard
            key={whatsappPlan.externalPlanId}
            plan={{
              ...whatsappPlan,
              price: formatPrice(whatsappPlan.price),
              display_name: whatsappPlan.name,
              plan_id: whatsappPlan.externalPlanId,
              currency:'USD',
              billing_interval: 'Monthly',
               product_type: 'whatsapp'
            }}
            isSelected={selectedPlan === 'whatsapp'}
            onSelect={() => handlePlanSelect('whatsapp')}
            highlightColor='green'
            icon={<Smartphone className='w-6 h-6' />}
          />
        )}

        {/* Bundle Plan */}
        {bundlePlan && (
          <PricingCard
            key={bundlePlan.externalPlanId}
            plan={{
              ...bundlePlan,
              price: formatPrice(bundlePlan.price),
              display_name: bundlePlan.name,
              plan_id: bundlePlan.externalPlanId,
              currency:'USD',
              billing_interval: 'Monthly',
               product_type: 'bundle'
            }}
            isSelected={selectedPlan === 'bundle'}
            onSelect={() => handlePlanSelect('bundle')}
            highlightColor='yellow'
            icon={<Zap className='w-6 h-6' />}
            isPopular={bundlePlan.is_popular}
          />
        )}
      </div>

      {/* Plan Comparison */}
      <div className='bg-zinc-900/50 border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto mb-16'>
        <h3 className='text-2xl font-medium text-white mb-6 text-center'>Compare Features</h3>
        <div className='overflow-x-auto'>
          <table className='w-full text-left'>
            <thead>
              <tr className='border-b border-white/10'>
                <th className='py-4 text-zinc-400 font-light'>Feature</th>
                <th className='py-4 text-center text-white'>Web Only</th>
                <th className='py-4 text-center text-white'>WhatsApp Only</th>
                <th className='py-4 text-center text-white'>Bundle</th>
              </tr>
            </thead>
            <tbody>
              <tr className='border-b border-white/10'>
                <td className='py-4 text-zinc-300'>Web Chat Widget</td>
                <td className='py-4 text-center text-green-400'>✓</td>
                <td className='py-4 text-center text-red-400'>✗</td>
                <td className='py-4 text-center text-green-400'>✓</td>
              </tr>
              <tr className='border-b border-white/10'>
                <td className='py-4 text-zinc-300'>WhatsApp Integration</td>
                <td className='py-4 text-center text-red-400'>✗</td>
                <td className='py-4 text-center text-green-400'>✓</td>
                <td className='py-4 text-center text-green-400'>✓</td>
              </tr>
              <tr className='border-b border-white/10'>
                <td className='py-4 text-zinc-300'>Monthly Messages</td>
                <td className='py-4 text-center'>1,000</td>
                <td className='py-4 text-center'>2,000</td>
                <td className='py-4 text-center'>5,000</td>
              </tr>
              <tr className='border-b border-white/10'>
                <td className='py-4 text-zinc-300'>Custom Branding</td>
                <td className='py-4 text-center text-green-400'>✓</td>
                <td className='py-4 text-center text-green-400'>✓</td>
                <td className='py-4 text-center text-green-400'>✓</td>
              </tr>
              <tr className='border-b border-white/10'>
                <td className='py-4 text-zinc-300'>AI Training</td>
                <td className='py-4 text-center text-green-400'>✓</td>
                <td className='py-4 text-center text-green-400'>✓</td>
                <td className='py-4 text-center text-green-400'>✓</td>
              </tr>
              <tr>
                <td className='py-4 text-zinc-300'>Priority Support</td>
                <td className='py-4 text-center text-zinc-500'>-</td>
                <td className='py-4 text-center text-zinc-500'>-</td>
                <td className='py-4 text-center text-green-400'>✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Selection Summary */}
      <div className='bg-zinc-900/50 border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto'>
        <div className='flex flex-col md:flex-row justify-between items-center gap-6'>
          <div>
            <h4 className='text-xl font-medium text-white mb-2'>Your Selection</h4>
            <p className='text-zinc-400'>
              {selectedPlan === 'webchat' && webchatPlan?.name}
              {selectedPlan === 'whatsapp' && whatsappPlan?.name}
              {selectedPlan === 'bundle' && bundlePlan?.name}
            </p>
          </div>
          
          <div className='text-right'>
            <div className='text-3xl font-medium text-white mb-1'>
              ${totalPrice}<span className='text-lg text-zinc-400 font-light'>/month</span>
            </div>
          </div>
          
          <button
            onClick={handleGetStarted}
            className='bg-white text-black px-8 py-3 rounded-xl hover:bg-zinc-200 transition-colors text-sm font-medium cursor-pointer w-full md:w-auto'
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
            question='Can I switch plans later?'
            answer='Yes! You can upgrade or downgrade your plan at any time. Changes are prorated.'
          />
          <FAQItem
            question='Do you offer yearly billing?'
            answer='Yes, we offer 20% discount for annual billing on all plans. Contact us for details.'
          />
          <FAQItem
            question='Is there a setup fee?'
            answer='No setup fees. You only pay for the plan you select on a monthly basis.'
          />
          <FAQItem
            question='Can I try before buying?'
            answer='Yes! We offer a 14-day free trial on all plans. No credit card required.'
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