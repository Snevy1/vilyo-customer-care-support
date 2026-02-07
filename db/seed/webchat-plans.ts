// seed/webchat-plans.ts
import { db } from '../client.ts'; 
import { webchatPlans } from '../schema.ts'; 

export async function seedWebchatPlans() {
  const plans = [
    {
      plan_id: 'webchat_free',
      external_plan_id: 'PLN_webchat_free_001',
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
        custom_domains: 1,
        file_sharing: false,
        chat_history_days: 7,
        response_time_guarantee: false,
        priority_support: false
      },
      integrations: ['basic'],
      is_active: true,
      is_default: true,
      sort_order: 1,
      provider: 'free'
    },
    {
      plan_id: 'webchat_starter',
      external_plan_id: 'PLN_webchat_starter_001',
      name: 'Starter',
      display_name: 'Starter Plan',
      description: 'Perfect for small businesses and startups',
      price: 2900, // $29.00
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
        custom_domains: 1,
        file_sharing: true,
        chat_history_days: 30,
        response_time_guarantee: false,
        priority_support: true
      },
      integrations: ['slack', 'email', 'basic'],
      is_active: true,
      is_default: false,
      sort_order: 2,
      provider: 'paystack'
    },
    {
      plan_id: 'webchat_pro',
      external_plan_id: 'PLN_webchat_pro_001',
      name: 'Professional',
      display_name: 'Professional Plan',
      description: 'For growing businesses with multiple teams',
      price: 7900, // $79.00
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
        custom_domains: 3,
        file_sharing: true,
        chat_history_days: 365, // 1 year
        response_time_guarantee: true,
        priority_support: true
      },
      integrations: ['slack', 'teams', 'zapier', 'api', 'webhooks'],
      is_active: true,
      is_default: false,
      sort_order: 3,
      provider: 'paystack'
    },
    {
      plan_id: 'webchat_enterprise',
      external_plan_id: 'PLN_webchat_enterprise_001',
      name: 'Enterprise',
      display_name: 'Enterprise Plan',
      description: 'For large organizations with custom needs',
      price: 19900, // $199.00
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
        max_chats_per_month: null, // Unlimited
        max_agents: null, // Unlimited
        ai_automation: true,
        custom_branding: true,
        custom_domains: null, // Unlimited
        file_sharing: true,
        chat_history_days: null, // Unlimited
        response_time_guarantee: true,
        priority_support: true
      },
      integrations: ['all'],
      is_active: true,
      is_default: false,
      sort_order: 4,
      provider: 'custom'
    }
  ];

  console.log('Seeding webchat plans...');
  
  for (const plan of plans) {
    const result = await db.insert(webchatPlans).values(plan).onConflictDoUpdate({
  target: webchatPlans.plan_id,
  set: {
    display_name: plan.display_name,
    description: plan.description,
    price: plan.price,
    features: plan.features,
    limits: plan.limits,
    integrations: plan.integrations,
    is_active: plan.is_active,
    sort_order: plan.sort_order,
    provider: plan.provider,
  },
});

    console.log(`Seeded webchat plan: ${plan.display_name}`);
  }
  
  console.log('Webchat plans seeding completed!');
}


async function main() {
  try {
    await seedWebchatPlans();
    console.log("✅ Seeding completed");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();



/* // Main seed function that runs all seeds
export async function runAllSeeds() {
  try {
    await seedWebchatPlans();
    // Add other seed functions here
    // await seedWhatsAppPlans();
    // await seedCRMPlans();
  } catch (error) {
    console.error('Error running seeds:', error);
    throw error;
  }
} */