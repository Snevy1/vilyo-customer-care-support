// services/plan-mapping.service.ts
import { ProductType } from "../subscriptions";

// Define provider-specific IDs
interface ProviderIds {
  paypal?: string;      // PayPal Plan ID
  stripe?: string;       // Stripe Price ID
  paystack?: string;     // Paystack Plan Code
}

const staticPlans = [
  {
    name: "Vilyo Support AI (Web Only)",
    slug: "web-support-basic",
    description: "Standard web-based chatbot for your website.",
    productId: "PROD-10349113AH7231608", //  internal product ID
    providerIds: {
      paypal: "P-3AS187416C269694RNGIEDRY",
      stripe: "price_1T9eJO7sqKlK93lgki7oyqot", //  Stripe Price ID
      // paystack: "PAYSTACK_PLAN_CODE", // Add when needed
      paystack: "PAYSTACK_PLAN_CODE_PREMIUM"
    },
    price: 2900, // Amount in cents
    currency: "usd",
    interval: "month", // month or year
    limits: {
      whatsapp_enabled: false,
      webchat_enabled: true,
      max_messages: 1000,
    },
    features: ["Custom Branding", "Web Widget", "AI Training"],
    is_default: true,
  },
  {
    name: "whatsApp Chatbot Plan",
    slug: "whatsapp-only",
    description: "Automate your customer support on WhatsApp.",
    productId: "PROD-10349113AH7231608",
    providerIds: {
      paypal: "P-0D976339TV311024ENGIETFQ",
      stripe: "price_1T9eJO7sqKlK93lgLz4EiZzK", //  Stripe Price ID
      paystack: "PAYSTACK_PLAN_CODE_PREMIUM"
    },
    price: 3900,
    currency: "usd",
    interval: "month",
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
    providerIds: {
      paypal: "P-45V132265G642635JNGIEHGA",
      stripe: "price_1T9eSU7sqKlK93lg5QOiWKHs", //  Stripe Price ID
      paystack: "PAYSTACK_PLAN_CODE_PREMIUM", // Example Paystack Plan Code
    },
    price: 5900,
    currency: "usd",
    interval: "month",
    limits: {
      whatsapp_enabled: true,
      webchat_enabled: true,
      max_messages: 5000,
    },
    features: ["Everything in Web + WhatsApp", "Priority Support", "Analytics"],
    is_popular: true,
  },
];

// Type for the plan
export type Plan = typeof staticPlans[0];

export function getPlanId(
  productType: ProductType,
  planSlug: string, // Better to use slug than name
  provider: "paypal" | "paystack" | "stripe"
): string | null {
  // Find by slug (more reliable than name)
  const plan = staticPlans.find(
    (p) => p.slug === planSlug
  );

  
  if (!plan) {
    throw new Error(
      `No plan found for slug "${planSlug}"`
    );
  }

  // Get the provider-specific ID
  const providerId = plan.providerIds[provider];
  
  if (!providerId) {
    throw new Error(
      `No ${provider} ID configured for plan "${plan.name}"`
    );
  }

  return providerId;
}

// Alternative: still support name-based lookup if needed
export function getPlanIdByName(
  productType: ProductType,
  planName: string,
  provider: "paypal" | "paystack" | "stripe"
): string | null {
  const plan = staticPlans.find(
    (p) => p.name.toLowerCase() === planName.toLowerCase()
  );

  if (!plan) {
    throw new Error(
      `No plan found for name "${planName}"`
    );
  }

  const providerId = plan.providerIds[provider];
  
  if (!providerId) {
    throw new Error(
      `No ${provider} ID configured for plan "${plan.name}"`
    );
  }

  return providerId;
}

export function getAvailableTiers(productType: ProductType): Plan[] {
  // Return full plan objects instead of just names
  return staticPlans;
}

export function getPlanBySlug(slug: string): Plan | null {
  return staticPlans.find((p) => p.slug === slug) ?? null;
}

// New utility functions for provider-specific needs
export function getStripePriceId(planSlug: string): string | null {
  const plan = getPlanBySlug(planSlug);
  return plan?.providerIds.stripe ?? null;
}

export function getPaypalPlanId(planSlug: string): string | null {
  const plan = getPlanBySlug(planSlug);
  return plan?.providerIds.paypal ?? null;
}

// For frontend display (without exposing provider IDs)
export function getPublicPlans() {
  return staticPlans.map(({ providerIds, ...publicPlan }) => ({
    ...publicPlan,
    // Don't expose provider IDs to frontend
  }));
}

export function isFreePlan(productType: ProductType, planSlug: string): boolean {
  const plan = getPlanBySlug(planSlug);
  return plan ? plan.price === 0 : false;
}

export { staticPlans };