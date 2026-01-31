"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
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
  const [selectedPlan, setSelectedPlan] = useState<string>('whatsapp_free_trial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock plans - in production, fetch from API
  const [plans] = useState<Plan[]>([
    {
      id: 'whatsapp_free_trial',
      name: 'Free Trial',
      description: '14-day free trial with basic features',
      price: 0,
      duration_days: 14,
      features: [
        'Up to 100 messages/month',
        'Basic AI responses',
        'Single WhatsApp number',
        'Email support'
      ]
    },
    {
      id: 'whatsapp_basic',
      name: 'Basic',
      description: 'For small businesses',
      price: 49,
      duration_days: 30,
      features: [
        'Up to 1,000 messages/month',
        'Advanced AI responses',
        'Single WhatsApp number',
        'Priority support',
        'Basic analytics'
      ]
    },
    {
      id: 'whatsapp_pro',
      name: 'Professional',
      description: 'For growing businesses',
      price: 99,
      duration_days: 30,
      features: [
        'Up to 5,000 messages/month',
        'Custom AI training',
        'Multiple WhatsApp numbers',
        '24/7 priority support',
        'Advanced analytics',
        'Custom integrations'
      ]
    }
  ]);

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
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error("Plan selection error:", err);
    } finally {
      setLoading(false);
    }
  };

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
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-xl p-6 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'border-blue-500 bg-blue-50 text-zinc-700 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </div>
                <div className="text-xs text-gray-500">{plan.duration_days} days</div>
              </div>
            </div>
            
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 rounded-lg font-medium ${
                selectedPlan === plan.id
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center border-t pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          disabled={loading}
        >
          Back
        </button>
        
        <div className="text-right">
          <p className="text-gray-600 mb-2">
            Selected: <span className="font-bold">{plans.find(p => p.id === selectedPlan)?.name}</span>
          </p>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              'Continue to WhatsApp Setup'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}