// services/subscription-service.ts
import { db } from "@/db/client";
import { ProductType, SUBSCRIPTION_PLANS } from "../subscriptions";
import { crmSubscription, organizations, whatsAppSubscription } from "@/db/schema";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";
import { PaymentProvider,Subscription as ProviderSubscription } from "@/app/api/subscriptions/interfaces/payment-provider.interface";

export type crmPlanTier = 'free' | 'pro' 
export type webChatTier = 'free' | 'pro';
export type whatsappPlanTier = 'standard' | 'premium';

interface CreateSubscriptionParams {
  organizationId: string;
  productType: ProductType;
  planTier: string;
  paymentProvider: 'paystack' | 'stripe' | 'paypal';
  planId: string;
  customerId: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

interface UpdateSubscriptionParams {
  subscriptionId: string;
  productType: ProductType;
  newPlanTier?: string;
  newPlanId?: string;
  metadata?: Record<string, any>;
}

interface RenewSubscriptionParams {
  subscriptionId: string;
  productType: ProductType;
  renewForDays?: number;
}

interface SearchSubscriptionsParams {
  organizationId?: string;
  productType?: ProductType;
  status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
  provider?: 'paystack' | 'stripe' | 'paypal';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

interface SubscriptionStats {
  total: number;
  active: number;
  cancelled: number;
  pastDue: number;
  totalMRR: number; // Monthly Recurring Revenue
  byProduct: Record<ProductType, number>;
  byProvider: Record<string, number>;
}


// Subscription Fetched data Type:


interface SubscriptionResponse {
  id: string;
  subscriptionData?: string[] | Record<string, unknown>;
  providerData: any | null;
  organizationId?:string;
  fetchedAt: string;
  // Optional fields
  tenantId?: string;
  maxContacts?: number;
  maxDeals?: number;
}

interface WebChatSubscriptionData {
  organizationId: string;
  productType: 'web_chat';
  planTier: string;
  status: string;
  provider: string;
  periodEnd: Date | string | null;
}

interface WhatsAppSubscriptionData {
  organizationId: string;
  tenantId: string;
  productType: 'whatsapp';
  planTier: string;
  status: string;
  provider: string;
  periodEnd: Date | string | null;
}

interface CRMSubscriptionData {
  organizationId: string;
  productType: 'crm';
  planTier: string;
  status: string;
  provider: string;
  periodEnd: Date | string | null;
  maxContacts: number;
  maxDeals: number;
}



export class SubscriptionService {
  constructor(private paymentProvider: PaymentProvider) {}
  
  // ============ CREATE ============
  async createSubscription(params: CreateSubscriptionParams) {
    const { 
      organizationId, 
      productType, 
      planTier, 
      paymentProvider, 
      planId, 
      tenantId,
      customerId,
      metadata 
    } = params;
    
    // 1. Create subscription in payment provider
    const providerSub: ProviderSubscription = await this.paymentProvider.createSubscription({
      customerId,
      planId,
      metadata: {
        ...metadata,
        organizationId,
        productType,
        planTier,
      },
    });
    
    // 2. Store in database
    switch(productType) {
      case 'web_chat':
        return db.update(organizations)
          .set({
            web_chat_plan: planTier,
            web_chat_subscription_id: providerSub.id,
            web_chat_provider: paymentProvider,
            web_chat_status: 'active',
            web_chat_period_end: providerSub.currentPeriodEnd,
            web_chat_created_at: new Date(),
            web_chat_updated_at: new Date(),
          })
          .where(eq(organizations.id, organizationId))
          .returning();
          
      case 'whatsapp':
        return db.insert(whatsAppSubscription).values({
          tenant_id: tenantId!,
          organization_id: organizationId,
          status: 'active',
          plan_tier: planTier,
          plan_id: planId,
          subscription_id: providerSub.id,
          provider: paymentProvider,
          current_period_end: providerSub.currentPeriodEnd,
          created_at: new Date(),
          updated_at: new Date(),
        }).returning();
        
      case 'crm':
        const crmPlan = SUBSCRIPTION_PLANS.crm[planTier as crmPlanTier];
        return db.insert(crmSubscription).values({
          organization_id: organizationId,
          status: 'active',
          plan_tier: planTier,
          plan_id: planId,
          subscription_id: providerSub.id,
          provider: paymentProvider,
          max_contacts: crmPlan?.maxContacts || 0,
          max_deals: crmPlan?.maxDeals || 0,
          current_period_start: new Date(),
          current_period_end: providerSub.currentPeriodEnd,
          created_at: new Date(),
          updated_at: new Date(),
        }).returning();
    }
  }
  
  // ============ READ ============
  
  // Get subscription by ID
  async getSubscriptionById(subscriptionId: string, productType: ProductType) {
    const providerSub = await this.paymentProvider.getSubscription({ subscriptionId });
    
    switch(productType) {
      case 'web_chat':
        const [org] = await db.select()
          .from(organizations)
          .where(eq(organizations.web_chat_subscription_id, subscriptionId))
          .limit(1);
        
        if (!org) return null;
        
        return {
          id: subscriptionId,
          organizationId: org.id,
          productType: 'web_chat',
          planTier: org.web_chat_plan,
          status: org.web_chat_status,
          provider: org.web_chat_provider,
          periodEnd: org.web_chat_period_end,
          providerData: providerSub,
        };
        
      case 'whatsapp':
        const [whatsapp] = await db.select()
          .from(whatsAppSubscription)
          .where(eq(whatsAppSubscription.subscription_id, subscriptionId))
          .limit(1);
        
        if (!whatsapp) return null;
        
        return {
          id: subscriptionId,
          organizationId: whatsapp.organization_id,
          tenantId: whatsapp.tenant_id,
          productType: 'whatsapp',
          planTier: whatsapp.plan_tier,
          status: whatsapp.status,
          provider: whatsapp.provider,
          periodEnd: whatsapp.current_period_end,
          providerData: providerSub,
        };
        
      case 'crm':
        const [crm] = await db.select()
          .from(crmSubscription)
          .where(eq(crmSubscription.subscription_id, subscriptionId))
          .limit(1);
        
        if (!crm) return null;
        
        return {
          id: subscriptionId,
          organizationId: crm.organization_id,
          productType: 'crm',
          planTier: crm.plan_tier,
          status: crm.status,
          provider: crm.provider,
          periodEnd: crm.current_period_end,
          maxContacts: crm.max_contacts,
          maxDeals: crm.max_deals,
          providerData: providerSub,
        };
    }
  }

  // Get subscription by OrganizationId
  async getSubscriptionByOrganizationId(
  organizationId: string, 
  productType: ProductType
): Promise<SubscriptionResponse | null> {
  try {
    // Validate inputs
    if (!organizationId || organizationId.trim() === '') {
      throw new Error('Organization ID is required');
    }

    if (!productType || !['web_chat', 'whatsapp', 'crm'].includes(productType)) {
      throw new Error('Invalid product type. Must be one of: web_chat, whatsapp, crm');
    }

    let subscriptionId: string | null = null;
    let subscriptionData: Record<string, any> | null = null;
    
    switch(productType) {
      case 'web_chat': {
        const [org] = await db.select()
          .from(organizations)
          .where(eq(organizations.id, organizationId))
          .limit(1);
        
        if (!org) {
          console.warn(`Organization not found: ${organizationId}`);
          return null;
        }
        
        if (!org.web_chat_subscription_id) {
          console.warn(`No web chat subscription found for organization: ${organizationId}`);
          return null;
        }
        
        subscriptionId = org.web_chat_subscription_id;
        subscriptionData = {
          organizationId: org.id,
          productType: 'web_chat' as const,
          planTier: org.web_chat_plan,
          status: org.web_chat_status,
          provider: org.web_chat_provider,
          periodEnd: org.web_chat_period_end,
        };
        break;
      }
        
      case 'whatsapp': {
        const [whatsapp] = await db.select()
          .from(whatsAppSubscription)
          .where(eq(whatsAppSubscription.organization_id, organizationId))
          .limit(1);
        
        if (!whatsapp) {
          console.warn(`WhatsApp subscription not found for organization: ${organizationId}`);
          return null;
        }
        
        subscriptionId = whatsapp.subscription_id;
        subscriptionData = {
          organizationId: whatsapp.organization_id,
          tenantId: whatsapp.tenant_id,
          productType: 'whatsapp' as const,
          planTier: whatsapp.plan_tier,
          status: whatsapp.status,
          provider: whatsapp.provider,
          periodEnd: whatsapp.current_period_end,
        };
        break;
      }
        
      case 'crm': {
        const [crm] = await db.select()
          .from(crmSubscription)
          .where(eq(crmSubscription.organization_id, organizationId))
          .limit(1);
        
        if (!crm) {
          console.warn(`CRM subscription not found for organization: ${organizationId}`);
          return null;
        }
        
        subscriptionId = crm.subscription_id;
        subscriptionData = {
          organizationId: crm.organization_id,
          productType: 'crm' as const,
          planTier: crm.plan_tier,
          status: crm.status,
          provider: crm.provider,
          periodEnd: crm.current_period_end,
          maxContacts: crm.max_contacts,
          maxDeals: crm.max_deals,
        };
        break;
      }
    }
    
    if (!subscriptionId || !subscriptionData) {
      // This should not happen if all cases are handled properly
      console.error('Unexpected state: subscriptionId or subscriptionData is null');
      return null;
    }
    
    // Fetch provider subscription data with timeout and error handling
    const providerSub = await Promise.race([
      this.paymentProvider.getSubscription({ subscriptionId }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Payment provider timeout')), 10000)
      )
    ]).catch((error: Error) => {
      console.error(`Failed to fetch subscription from payment provider: ${error.message}`, {
        subscriptionId,
        organizationId,
        productType,
      });
      // Return null for provider data if fetch fails
      return null;
    });
    
    return {
      id: subscriptionId,
      ...subscriptionData,
      providerData: providerSub,
      // Add metadata
      fetchedAt: new Date().toISOString(),
    };
    
  } catch (error:any) {
    // Log unexpected errors
    console.error(`Error in getSubscriptionByOrganizationId: ${error.message}`, {
      organizationId,
      productType,
      stack: error.stack,
    });
    
    // Re-throw if it's a validation error, otherwise return null
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      throw error; // Let the caller handle validation errors
    }
    
    return null;
  }
}
  
  // Get all subscriptions for organization (with pagination)
  async getOrganizationSubscriptions(
    organizationId: string, 
    filters?: {
      productType?: ProductType;
      status?: string;
      provider?: string;
    }
  ) {
    const conditions = [eq(organizations.id, organizationId)];
    
    const [org] = await db.select()
      .from(organizations)
      .where(and(...conditions))
      .limit(1);
    
    const whatsappConditions = [eq(whatsAppSubscription.organization_id, organizationId)];
    if (filters?.status) {
      whatsappConditions.push(eq(whatsAppSubscription.status, filters.status));
    }
    if (filters?.provider) {
      whatsappConditions.push(eq(whatsAppSubscription.provider, filters.provider));
    }
    
    const crmConditions = [eq(crmSubscription.organization_id, organizationId)];
    if (filters?.status) {
      crmConditions.push(eq(crmSubscription.status, filters.status));
    }
    if (filters?.provider) {
      crmConditions.push(eq(crmSubscription.provider, filters.provider));
    }
    
    const [whatsapp, crm] = await Promise.all([
      filters?.productType === 'whatsapp' || !filters?.productType
        ? db.select()
            .from(whatsAppSubscription)
            .where(and(...whatsappConditions))
        : Promise.resolve([]),
      
      filters?.productType === 'crm' || !filters?.productType
        ? db.select()
            .from(crmSubscription)
            .where(and(...crmConditions))
        : Promise.resolve([]),
    ]);
    
    const subscriptions = [];
    
    // Web Chat subscription
    if (org?.web_chat_subscription_id && 
        (filters?.productType === 'web_chat' || !filters?.productType) &&
        (!filters?.status || org.web_chat_status === filters.status) &&
        (!filters?.provider || org.web_chat_provider === filters.provider)) {
      subscriptions.push({
        id: org.web_chat_subscription_id,
        productType: 'web_chat' as const,
        planTier: org.web_chat_plan,
        status: org.web_chat_status,
        provider: org.web_chat_provider,
        periodEnd: org.web_chat_period_end,
        createdAt: org.web_chat_created_at,
      });
    }
    
    // WhatsApp subscriptions
    subscriptions.push(...whatsapp.map(sub => ({
      id: sub.subscription_id,
      productType: 'whatsapp' as const,
      planTier: sub.plan_tier,
      status: sub.status,
      provider: sub.provider,
      periodEnd: sub.current_period_end,
      tenantId: sub.tenant_id,
      createdAt: sub.created_at,
    })));
    
    // CRM subscriptions
    subscriptions.push(...crm.map(sub => ({
      id: sub.subscription_id,
      productType: 'crm' as const,
      planTier: sub.plan_tier,
      status: sub.status,
      provider: sub.provider,
      periodEnd: sub.current_period_end,
      maxContacts: sub.max_contacts,
      maxDeals: sub.max_deals,
      createdAt: sub.created_at,
    })));
    
    return subscriptions;
  }
  
  // Search subscriptions with filters
  async searchSubscriptions(params: SearchSubscriptionsParams) {
    const { 
      organizationId, 
      productType, 
      status, 
      provider, 
      startDate, 
      endDate,
      limit = 50,
      offset = 0 
    } = params;
    
    // This is a simplified search - in production, you'd want more optimized queries
    const allSubscriptions = [];
    
    if (!productType || productType === 'web_chat') {
      const conditions = [];
      if (organizationId) conditions.push(eq(organizations.id, organizationId));
      if (status) conditions.push(eq(organizations.web_chat_status, status));
      if (provider) conditions.push(eq(organizations.web_chat_provider, provider));
      if (startDate) conditions.push(gte(organizations.web_chat_period_end, startDate));
      if (endDate) conditions.push(lte(organizations.web_chat_period_end, endDate));
      
      const orgs = await db.select()
        .from(organizations)
        .where(conditions.length ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset);
      
      allSubscriptions.push(...orgs.filter(org => org.web_chat_subscription_id).map(org => ({
        id: org.web_chat_subscription_id,
        organizationId: org.id,
        organizationName: org.name,
        productType: 'web_chat' as const,
        planTier: org.web_chat_plan,
        status: org.web_chat_status,
        provider: org.web_chat_provider,
        periodEnd: org.web_chat_period_end,
        createdAt: org.web_chat_created_at,
      })));
    }
    
    // Similar logic for whatsapp and crm tables
    // Implementation would be similar to above...
    
    return allSubscriptions;
  }
  
  // ============ UPDATE ============
  
  // Update subscription (change plan, metadata, etc.)
  async updateSubscription(params: UpdateSubscriptionParams) {
    const { subscriptionId, productType, newPlanTier, newPlanId, metadata } = params;
    
    // Note: Updating subscription in payment provider depends on the provider's API
    // Some providers support updating subscriptions, others require cancellation + new creation
    
    switch(productType) {
      case 'web_chat':
        const updateData: any = { web_chat_updated_at: new Date() };
        if (newPlanTier) updateData.web_chat_plan = newPlanTier;
        if (metadata) updateData.web_chat_metadata = metadata;
        
        return db.update(organizations)
          .set(updateData)
          .where(eq(organizations.web_chat_subscription_id, subscriptionId))
          .returning();
          
      case 'whatsapp':
        const whatsappData: any = { updated_at: new Date() };
        if (newPlanTier) whatsappData.plan_tier = newPlanTier;
        if (newPlanId) whatsappData.plan_id = newPlanId;
        if (metadata) whatsappData.metadata = metadata;
        
        return db.update(whatsAppSubscription)
          .set(whatsappData)
          .where(eq(whatsAppSubscription.subscription_id, subscriptionId))
          .returning();
          
      case 'crm':
        const crmData: any = { updated_at: new Date() };
        if (newPlanTier) {
          crmData.plan_tier = newPlanTier;
          const crmPlan = SUBSCRIPTION_PLANS.crm[newPlanTier as crmPlanTier];
          if (crmPlan) {
            crmData.max_contacts = crmPlan.maxContacts;
            crmData.max_deals = crmPlan.maxDeals;
          }
        }
        if (metadata) crmData.metadata = metadata;
        
        return db.update(crmSubscription)
          .set(crmData)
          .where(eq(crmSubscription.subscription_id, subscriptionId))
          .returning();
    }
  }
  
  // Upgrade/downgrade subscription plan
  async changeSubscriptionPlan(
    subscriptionId: string,
    productType: ProductType,
    newPlanTier: string,
    newPlanId: string
  ) {
    // 1. Get current subscription
    const currentSub = await this.getSubscriptionById(subscriptionId, productType);
    if (!currentSub) {
      throw new Error('Subscription not found');
    }
    
    // 2. Update in payment provider (implementation depends on provider)
    // Some providers have dedicated upgrade/downgrade endpoints
    // Others require cancelling and creating new subscription
    
    // 3. Update in database
    return this.updateSubscription({
      subscriptionId,
      productType,
      newPlanTier,
      newPlanId,
      metadata: { 
        previousPlan: currentSub.planTier,
        upgradedAt: new Date().toISOString(),
      },
    });
  }
  
  // Renew subscription (extend end date)
  async renewSubscription(params: RenewSubscriptionParams) {
    const { subscriptionId, productType, renewForDays = 30 } = params;
    
    // Get current subscription
    const currentSub = await this.getSubscriptionById(subscriptionId, productType);
    if (!currentSub) {
      throw new Error('Subscription not found');
    }
    
    const newPeriodEnd = new Date();
    newPeriodEnd.setDate(newPeriodEnd.getDate() + renewForDays);
    
    switch(productType) {
      case 'web_chat':
        return db.update(organizations)
          .set({ 
            web_chat_period_end: newPeriodEnd,
            web_chat_updated_at: new Date(),
          })
          .where(eq(organizations.web_chat_subscription_id, subscriptionId))
          .returning();
          
      case 'whatsapp':
        return db.update(whatsAppSubscription)
          .set({ 
            current_period_end: newPeriodEnd,
            updated_at: new Date(),
          })
          .where(eq(whatsAppSubscription.subscription_id, subscriptionId))
          .returning();
          
      case 'crm':
        return db.update(crmSubscription)
          .set({ 
            current_period_end: newPeriodEnd,
            updated_at: new Date(),
          })
          .where(eq(crmSubscription.subscription_id, subscriptionId))
          .returning();
    }
  }
  
  // Pause subscription
  async pauseSubscription(subscriptionId: string, productType: ProductType) {
    // 1. Update status in database
    switch(productType) {
      case 'web_chat':
        await db.update(organizations)
          .set({ 
            web_chat_status: 'paused',
            web_chat_updated_at: new Date(),
          })
          .where(eq(organizations.web_chat_subscription_id, subscriptionId));
        break;
        
      case 'whatsapp':
        await db.update(whatsAppSubscription)
          .set({ 
            status: 'paused',
            updated_at: new Date(),
          })
          .where(eq(whatsAppSubscription.subscription_id, subscriptionId));
        break;
        
      case 'crm':
        await db.update(crmSubscription)
          .set({ 
            status: 'paused',
            updated_at: new Date(),
          })
          .where(eq(crmSubscription.subscription_id, subscriptionId));
        break;
    }
    
    // 2. Try to pause in payment provider (if supported)
    try {
      if ('pauseSubscription' in this.paymentProvider) {
        await (this.paymentProvider as any).pauseSubscription({ subscriptionId });
      }
    } catch (error) {
      console.warn('Provider does not support pausing subscriptions:', error);
    }
  }
  
  // Resume paused subscription
  async resumeSubscription(subscriptionId: string, productType: ProductType) {
    // 1. Update status in database
    switch(productType) {
      case 'web_chat':
        await db.update(organizations)
          .set({ 
            web_chat_status: 'active',
            web_chat_updated_at: new Date(),
          })
          .where(eq(organizations.web_chat_subscription_id, subscriptionId));
        break;
        
      case 'whatsapp':
        await db.update(whatsAppSubscription)
          .set({ 
            status: 'active',
            updated_at: new Date(),
          })
          .where(eq(whatsAppSubscription.subscription_id, subscriptionId));
        break;
        
      case 'crm':
        await db.update(crmSubscription)
          .set({ 
            status: 'active',
            updated_at: new Date(),
          })
          .where(eq(crmSubscription.subscription_id, subscriptionId));
        break;
    }
    
    // 2. Try to resume in payment provider (if supported)
    try {
      if ('resumeSubscription' in this.paymentProvider) {
        await (this.paymentProvider as any).resumeSubscription({ subscriptionId });
      }
    } catch (error) {
      console.warn('Provider does not support resuming subscriptions:', error);
    }
  }
  
  // ============ DELETE ============
  
  // Cancel subscription (soft delete - keeps record)
  async cancelSubscription(
    subscriptionId: string, 
    productType: ProductType,
    reason?: string
  ) {
    // 1. Cancel in payment provider
    await this.paymentProvider.cancelSubscription({
      subscriptionId,
      reason,
    });
    
    // 2. Update status in DB
    switch(productType) {
      case 'web_chat':
        return db.update(organizations)
          .set({ 
            web_chat_status: 'cancelled',
            web_chat_cancelled_at: new Date(),
            web_chat_updated_at: new Date(),
          })
          .where(eq(organizations.web_chat_subscription_id, subscriptionId))
          .returning();
          
      case 'whatsapp':
        return db.update(whatsAppSubscription)
          .set({ 
            status: 'cancelled',
            cancelled_at: new Date(),
            updated_at: new Date(),
          })
          .where(eq(whatsAppSubscription.subscription_id, subscriptionId))
          .returning();
          
      case 'crm':
        return db.update(crmSubscription)
          .set({ 
            status: 'cancelled',
            cancelled_at: new Date(),
            updated_at: new Date(),
          })
          .where(eq(crmSubscription.subscription_id, subscriptionId))
          .returning();
    }
  }
  
  // Delete subscription (hard delete - removes record)
  async deleteSubscription(subscriptionId: string, productType: ProductType) {
    // 1. Cancel in payment provider first
    await this.cancelSubscription(subscriptionId, productType, 'Hard delete requested');
    
    // 2. Delete from database
    switch(productType) {
      case 'web_chat':
        // For web_chat, we just remove the subscription ID but keep organization
        return db.update(organizations)
          .set({ 
            web_chat_subscription_id: null,
            web_chat_status: 'free',
            web_chat_plan: 'free',
            web_chat_updated_at: new Date(),
          })
          .where(eq(organizations.web_chat_subscription_id, subscriptionId));
          
      case 'whatsapp':
        return db.delete(whatsAppSubscription)
          .where(eq(whatsAppSubscription.subscription_id, subscriptionId));
          
      case 'crm':
        return db.delete(crmSubscription)
          .where(eq(crmSubscription.subscription_id, subscriptionId));
    }
  }
  
  // ============ UTILITY/STATS METHODS ============
  
  // Get subscription statistics
  async getSubscriptionStats(organizationId?: string): Promise<SubscriptionStats> {
    const stats: SubscriptionStats = {
      total: 0,
      active: 0,
      cancelled: 0,
      pastDue: 0,
      totalMRR: 0,
      byProduct: { web_chat: 0, whatsapp: 0, crm: 0 },
      byProvider: {},
    };
    
    // Count web_chat subscriptions
    const webChatConditions = organizationId 
      ? [eq(organizations.id, organizationId)]
      : [];
    webChatConditions.push(eq(organizations.web_chat_plan, 'pro')); // Only paid plans
    
    const webChatOrgs = await db.select()
      .from(organizations)
      .where(and(...webChatConditions));
    
    webChatOrgs.forEach(org => {
      if (org.web_chat_subscription_id) {
        stats.total++;
        stats.byProduct.web_chat++;
        
        if (org.web_chat_status === 'active') stats.active++;
        if (org.web_chat_status === 'cancelled') stats.cancelled++;
        if (org.web_chat_status === 'past_due') stats.pastDue++;
        
        if (org.web_chat_provider) {
          stats.byProvider[org.web_chat_provider] = (stats.byProvider[org.web_chat_provider] || 0) + 1;
        }
        
        // Add to MRR (simplified - should get actual price from plan)
        if (org.web_chat_status === 'active' && org.web_chat_plan === 'pro') {
          stats.totalMRR += 10; // Example: $10/month for web_chat pro
        }
      }
    });
    
    // Count whatsapp subscriptions
    const whatsappConditions = organizationId 
      ? [eq(whatsAppSubscription.organization_id, organizationId)]
      : [];
    
    const whatsappSubs = await db.select()
      .from(whatsAppSubscription)
      .where(and(...whatsappConditions));
    
    whatsappSubs.forEach(sub => {
      stats.total++;
      stats.byProduct.whatsapp++;
      
      if (sub.status === 'active') stats.active++;
      if (sub.status === 'cancelled') stats.cancelled++;
      if (sub.status === 'past_due') stats.pastDue++;
      
      if (sub.provider) {
        stats.byProvider[sub.provider] = (stats.byProvider[sub.provider] || 0) + 1;
      }
      
      // Add to MRR
      if (sub.status === 'active') {
        stats.totalMRR += sub.plan_tier === 'premium' ? 25 : 15; // Example pricing
      }
    });
    
    // Count CRM subscriptions
    const crmConditions = organizationId 
      ? [eq(crmSubscription.organization_id, organizationId)]
      : [];
    
    const crmSubs = await db.select()
      .from(crmSubscription)
      .where(and(...crmConditions));
    
    crmSubs.forEach(sub => {
      stats.total++;
      stats.byProduct.crm++;
      
      if (sub.status === 'active') stats.active++;
      if (sub.status === 'cancelled') stats.cancelled++;
      if (sub.status === 'past_due') stats.pastDue++;
      
      if (sub.provider) {
        stats.byProvider[sub.provider] = (stats.byProvider[sub.provider] || 0) + 1;
      }
      
      // Add to MRR
      if (sub.status === 'active') {
        if (sub.plan_tier === 'enterprise') stats.totalMRR += 100;
        else if (sub.plan_tier === 'pro') stats.totalMRR += 50;
      }
    });
    
    return stats;
  }
  
  // Get expiring subscriptions (within X days)
  async getExpiringSubscriptions(daysUntilExpiry: number = 7) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);
    
    const expiringSubs = [];
    
    // Check web_chat subscriptions
    const expiringWebChat = await db.select()
      .from(organizations)
      .where(
        and(
          eq(organizations.web_chat_status, 'active'),
          lte(organizations.web_chat_period_end, expiryDate),
          gte(organizations.web_chat_period_end, new Date())
        )
      );
    
    expiringSubs.push(...expiringWebChat.map(org => ({
      id: org.web_chat_subscription_id!,
      organizationId: org.id,
      organizationName: org.name,
      productType: 'web_chat' as const,
      planTier: org.web_chat_plan,
      expiresAt: org.web_chat_period_end,
      daysUntilExpiry: Math.ceil((org.web_chat_period_end!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    })));
    
    // Similar logic for whatsapp and crm...
    
    return expiringSubs.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }
  
  // Sync subscription status from provider
  async syncSubscriptionStatus(subscriptionId: string, productType: ProductType) {
    // 1. Get latest status from payment provider
    const providerSub = await this.paymentProvider.getSubscription({ subscriptionId });
    
    // 2. Update in database
    switch(productType) {
      case 'web_chat':
        return db.update(organizations)
          .set({ 
            web_chat_status: providerSub.status,
            web_chat_period_end: providerSub.currentPeriodEnd,
            web_chat_updated_at: new Date(),
          })
          .where(eq(organizations.web_chat_subscription_id, subscriptionId));
          
      case 'whatsapp':
        return db.update(whatsAppSubscription)
          .set({ 
            status: providerSub.status,
            current_period_end: providerSub.currentPeriodEnd,
            updated_at: new Date(),
          })
          .where(eq(whatsAppSubscription.subscription_id, subscriptionId));
          
      case 'crm':
        return db.update(crmSubscription)
          .set({ 
            status: providerSub.status,
            current_period_end: providerSub.currentPeriodEnd,
            updated_at: new Date(),
          })
          .where(eq(crmSubscription.subscription_id, subscriptionId));
    }
  }
  
  // Validate subscription access (for middleware)
  async validateSubscriptionAccess(
    organizationId: string,
    productType: ProductType,
    requiredPlanTier?: string
  ): Promise<boolean> {
    const subscriptions = await this.getOrganizationSubscriptions(organizationId, {
      productType,
      status: 'active',
    });
    
    if (subscriptions.length === 0) {
      return false;
    }
    
    if (!requiredPlanTier) {
      return true;
    }
    
    // Check if any subscription has the required tier or higher
    const subscription = subscriptions[0];
    const tierHierarchy: Record<string, number> = {
      'free': 0,
      'standard': 1,
      'pro': 2,
      'enterprise': 3,
      'premium': 4,
    };

    const tier = subscription.planTier;
      if (!tier) return false; 

    
    const currentTierLevel = tierHierarchy[tier] || 0;
    const requiredTierLevel = tierHierarchy[requiredPlanTier] || 0;
    
    return currentTierLevel >= requiredTierLevel;
  }
}
// Example of how to use it:

// const paystackClient = new ActualPaystackClient();
// const subscriptionService = new SubscriptionService(paystackClient);