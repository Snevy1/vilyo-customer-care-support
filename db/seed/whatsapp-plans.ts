// seed/whatsapp-plans.ts

import { db } from "../client.ts";
import { whatsAppPlans } from "../schema.ts";

async function seedWhatsAppPlans() {
  const plans = [
    {
      plan_id: 'whatsapp_free_trial',
      external_plan_id: 'PLN_free_trial_001', // Example Paystack plan code
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
        whatsapp_numbers: 1,
        ai_responses: true,
        custom_ai_training: false,
        support_type: 'email',
        analytics: ['basic'],
        custom_integrations: false,
        max_users: 1
      },
      is_active: true,
      is_default: true,
      sort_order: 1,
      provider: 'paystack'
    },
    {
      plan_id: 'whatsapp_basic',
      external_plan_id: 'PLN_basic_monthly_001',
      name: 'Basic',
      display_name: 'Basic Plan',
      description: 'For small businesses',
      price: 4900, // $49.00 in cents
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
        whatsapp_numbers: 1,
        ai_responses: true,
        custom_ai_training: false,
        support_type: 'priority',
        analytics: ['basic', 'message_volume'],
        custom_integrations: false,
        max_users: 3
      },
      is_active: true,
      is_default: false,
      sort_order: 2,
      provider: 'paystack'
    },
    {
      plan_id: 'whatsapp_pro',
      external_plan_id: 'PLN_pro_monthly_001',
      name: 'Professional',
      display_name: 'Professional Plan',
      description: 'For growing businesses',
      price: 9900, // $99.00 in cents
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
        whatsapp_numbers: 3,
        ai_responses: true,
        custom_ai_training: true,
        support_type: '24/7',
        analytics: ['basic', 'message_volume', 'response_time', 'engagement'],
        custom_integrations: true,
        max_users: 10
      },
      is_active: true,
      is_default: false,
      sort_order: 3,
      provider: 'paystack'
    }
  ];


  for (const plan of plans) {
    await db
      .insert(whatsAppPlans)
      .values(plan)
      .onConflictDoUpdate({
        target: whatsAppPlans.plan_id,
        set: plan,
      });
  }

  console.log("✅ WhatsApp plans seeded successfully");
}

async function main() {
  try {
    await seedWhatsAppPlans();
    console.log("✅ Seeding completed");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}




main();
