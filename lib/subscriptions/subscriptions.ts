

// Enum for subscription status
export const subscriptionStatusEnum = ['active', 'past_due', 'cancelled', 'trialing', 'incomplete'] as const;
export type SubscriptionStatus = typeof subscriptionStatusEnum[number];

// Product types
export const productTypes = ['web_chat', 'whatsapp', 'crm'] as const;
export type ProductType = typeof productTypes[number];



// Subscription plans configuration (store in config)
export const SUBSCRIPTION_PLANS = {
  web_chat: {
    free: { price: 0, features: ['basic_widget', '100_msgs_per_month'] },
    pro: { price: 2000, features: ['custom_branding', 'unlimited_msgs', 'analytics'] }
  },
  whatsapp: {
    standard: { price: 5000, features: ['whatsapp_integration', 'unlimited_msgs'] }
  },
  crm: {
    free: { price: 0, maxContacts: 1000, maxDeals: 100 },
    pro: { price: 3000, maxContacts: -1, maxDeals: -1 } // -1 = unlimited
  }
} as const;