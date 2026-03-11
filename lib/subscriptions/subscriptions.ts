import { db } from "@/db/client";
import { fullSubscription, organizations, whatsAppSubscription } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";


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



export async function getSubscriptionData(orgId: string) {
  const now = new Date();

  // 1. Fetch Active Subs
  const [waSubs, fullSubs] = await Promise.all([
    db.select().from(whatsAppSubscription).where(
      and(
        eq(whatsAppSubscription.organization_id, orgId),
        eq(whatsAppSubscription.status, 'active'),
        gt(whatsAppSubscription.current_period_end, now)
      )
    ),
    db.select().from(fullSubscription).where(
      and(
        eq(fullSubscription.organization_id, orgId),
        eq(fullSubscription.status, 'active'),
        gt(fullSubscription.current_period_end, now)
      )
    )
  ]);

  // 2. Fetch Transaction History (Assuming you want to see both tables' records as "transactions")
  // In a production app, you might have a dedicated 'invoices' or 'transactions' table.
  // For now, we'll pull the most recent records from both.
  const history = [...waSubs, ...fullSubs].sort((a, b) => 
    b.created_at!.getTime() - a.created_at!.getTime()
  );

  return { waSubs, fullSubs, history };
}