import { NextResponse } from 'next/server';

// Define available plans
const WHATSAPP_PLANS = [
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
  },
  {
    id: 'whatsapp_enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 299,
    duration_days: 30,
    features: [
      'Unlimited messages',
      'Custom AI models',
      'Multiple WhatsApp numbers',
      'Dedicated account manager',
      'Full analytics suite',
      'API access',
      'Custom SLAs'
    ]
  }
];

export async function GET() {
  return NextResponse.json({ plans: WHATSAPP_PLANS });
}