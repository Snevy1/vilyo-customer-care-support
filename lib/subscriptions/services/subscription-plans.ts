// services/plan-mapping.service.ts
import { ProductType} from "../subscriptions";


const PLANS = {
  web_chat: {
    free: {
      paystack: null,
      stripe: null,
      paypal: null,
    },
    pro: {
      paystack: process.env.PAYSTACK_WEB_CHAT_PRO_PLAN_CODE,
      stripe: process.env.STRIPE_WEB_CHAT_PRO_PRICE_ID || 'price_web_chat_pro_monthly',
      paypal: process.env.PAYPAL_WEB_CHAT_PRO_PLAN_ID || 'P-WEB-CHAT-PRO',
    },
  },
  whatsapp: {
    standard: {
      paystack: process.env.PAYSTACK_WHATSAPP_STANDARD_PLAN_CODE,
      stripe: process.env.STRIPE_WHATSAPP_STANDARD_PRICE_ID || 'price_whatsapp_standard_monthly',
      paypal: process.env.PAYPAL_WHATSAPP_STANDARD_PLAN_ID || 'P-WHATSAPP-STANDARD',
    },
    premium: {
      paystack: process.env.PAYSTACK_WHATSAPP_PREMIUM_PLAN_CODE,
      stripe: process.env.STRIPE_WHATSAPP_PREMIUM_PRICE_ID || 'price_whatsapp_premium_monthly',
      paypal: process.env.PAYPAL_WHATSAPP_PREMIUM_PLAN_ID || 'P-WHATSAPP-PREMIUM',
    },
  },
  crm: {
    free: {
      paystack: null,
      stripe: null,
      paypal: null,
    },
    pro: {
      paystack: process.env.PAYSTACK_CRM_PRO_PLAN_CODE,
      stripe: process.env.STRIPE_CRM_PRO_PRICE_ID || 'price_crm_pro_monthly',
      paypal: process.env.PAYPAL_CRM_PRO_PLAN_ID || 'P-CRM-PRO',
    },
    enterprise: {
      paystack: process.env.PAYSTACK_CRM_ENTERPRISE_PLAN_CODE,
      stripe: process.env.STRIPE_CRM_ENTERPRISE_PRICE_ID || 'price_crm_enterprise_monthly',
      paypal: process.env.PAYPAL_CRM_ENTERPRISE_PLAN_ID || 'P-CRM-ENTERPRISE',
    },
  },
} as const;

export function getPlanId(
  productType: ProductType,
  planTier: string,
  provider: 'paystack' | 'stripe' | 'paypal'
): string | null {
  // Type-safe access with proper checks
  const productPlans = PLANS[productType as keyof typeof PLANS];
  
  if (!productPlans) {
    throw new Error(`Invalid product type: ${productType}`);
  }
  
  const tierPlans = productPlans[planTier as keyof typeof productPlans];
  
  if (!tierPlans) {
    throw new Error(`Invalid plan tier for ${productType}: ${planTier}`);
  }
  
  const planId = tierPlans[provider];
  
  // For free plans, return null
  if (planId === null) {
    return null;
  }
  
  if (!planId && planTier !== 'free') {
    throw new Error(`Plan configuration missing for ${productType}.${planTier}.${provider}`);
  }
  
  return planId;
}

// Helper to get all available tiers for a product
export function getAvailableTiers(productType: ProductType): string[] {
  const productPlans = PLANS[productType as keyof typeof PLANS];
  return productPlans ? Object.keys(productPlans) : [];
}

// Helper to check if a plan is free
export function isFreePlan(productType: ProductType, planTier: string): boolean {
  const planId = getPlanId(productType, planTier, 'paystack'); // Check any provider
  return planId === null;
}