import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex, jsonb, serial, bigint, integer} from "drizzle-orm/pg-core";

 export const user = pgTable ("user", {
    id: text("id")
        .primaryKey()
        .default(sql `gen_random_uuid()`),
        organization_id: text("organization_id").notNull(),
        name: text("name"),
        email: text("email").notNull().unique(),
        image: text("image"),
        created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),

}); 

// organization
export const organizations = pgTable("organizations", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  timezone: text('timezone').default('UTC').notNull(),
  
  // Web chatbot subscription fields
  web_chat_plan: text("web_chat_plan").default("free").notNull(), // 'free', 'pro'
  web_chat_subscription_id: text("web_chat_subscription_id"), // Paystack subscription_code
  web_chat_status: text("web_chat_status").default("active"), // Always at least 'free'
  web_chat_period_end: timestamp("web_chat_period_end", { withTimezone: true }),
  web_chat_payment_method: text('web_chat_payment_method'), // Only for paid plans
  web_chat_provider: text('web_chat_provider'), // 'stripe', 'paystack'
  web_chat_created_at:  timestamp("web_chat_created_at", { withTimezone: true }),
  web_chat_cancelled_at: timestamp("web_chat_cancelled_at", { withTimezone: true }),
  web_chat_updated_at:  timestamp("web_chat_updated_at", { withTimezone: true }),
  owner_email: text("owner_email").notNull(),
  owner_phone: text('owner_phone'),
  created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
}, (table) => ({
  emailIdx: uniqueIndex("organizations_email_idx").on(table.email),
}));

export const metadata = pgTable("metadata", {
    id: text("id").primaryKey()
         .default(sql `gen_random_uuid()`),
        user_email: text("user_email").notNull(),
        business_name: text("business_name").notNull(),
        website_url: text("website_url").notNull(),
        external_links: text("external_links"),
        created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  
        
})


export const knowledge_source = pgTable("knowledge_source", {
   id: text("id") 
       .primaryKey()
       .default(sql `gen_random_uuid()`),
    user_email: text("user_email").notNull(),
    type: text("type").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    source_url: text("source_url"),
    content: text("content"),
    meta_data: text("meta_data"),
    last_updated: text("last_updated").default(sql `now()`),
    
    created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  


})



export const sections = pgTable("sections", {
    id: text("id") 
       .primaryKey()
       .default(sql `gen_random_uuid()`),
    user_email: text("user_email").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    source_ids: text("source_ids").array().notNull(),
    tone: text("tone").notNull(),
    allowed_topics: text("allowed_topics"),
    blocked_topics: text("blocked_topics"),
    status: text("status").notNull().default("active"),
       created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
 

});


export const chatBotMetadata = pgTable("chatBotMetadata", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    user_email: text("user_email").notNull(),
    organization_id: text("organization_id").notNull(),
    
    //   channel support
    channels: text("channels").array().default(sql`ARRAY['web']::text[]`), // ['web', 'whatsapp']
    
    color: text("color").default("#4f39f6"),
    welcome_message: text("welcome_message").default("Hi there, How can I help you today?"),
    
    // Channel-specific settings (JSON)
    whatsapp_settings: jsonb("whatsapp_settings"), // { greeting: "...", quickReplies: [...] }
    web_settings: jsonb("web_settings"), // { theme: "...", position: "..." }
    bot_enabled: boolean('bot_enabled').default(true),
    
    
    created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
 
}, (table) => ({
    orgIdx: index("chatbot_org_idx").on(table.organization_id),
}));

 export const team_members = pgTable("team_members",{
    id: text("id") 
       .primaryKey()
       .default(sql `gen_random_uuid()`),
    user_email: text("user_email").notNull(),
    name: text("name").notNull(),
    organization_id: text("organization_id").notNull(),
    role:text("role").notNull().default("member"),
    status: text("status").notNull().default("pending"),
    created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  
 });


 //  Universal conversation table
export const conversation = pgTable("conversation", {
   id: text("id").primaryKey().default(sql`gen_random_uuid()`),
   
   // Channel identification
   channel: text("channel").notNull().default("web"), // 'web' | 'whatsapp'
   chatbot_id: text("chatbot_id").notNull(),
   organization_id: text("organization_id").notNull(),
   
   // Universal fields
   name: text("name"),
   contact_name: text("contact_name"),
   visitor_ip: text("visitor_ip"),
   user_email: text("user_email"),
   
   // Channel-specific identifiers
   whatsapp_phone: text("whatsapp_phone"),
   session_token: text("session_token"),

    // Takeover
  is_human_takeover: boolean('is_human_takeover').default(false),
  human_agent_id: text('human_agent_id'), // Optional: track which agent took over
  takeover_started_at: timestamp('takeover_started_at'),
   
   // CRM integration
   crm_contact_id: text("crm_contact_id"),
   crm_company_id: text("crm_company_id"),
   crm_synced: boolean("crm_synced").default(false),
   crm_synced_at: timestamp("crm_synced_at", { withTimezone: true }),
   
   // Lead scoring
   lead_score: text("lead_score"),
   lead_quality: text("lead_quality"),
   visitor_email: text("visitor_email"),
   visitor_company: text("visitor_company"),
   
   // Conversation state
   status: text("status").default("active"), // 'active' | 'resolved' | 'archived'
   assigned_to: text("assigned_to"), // team member handling this
   
   created_at: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
   updated_at: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
}, (table) => ({
   channelIdx: index("conversation_channel_idx").on(table.channel),
   orgIdx: index("conversation_org_idx").on(table.organization_id),
   chatbotIdx: index("conversation_chatbot_idx").on(table.chatbot_id),
   whatsappPhoneIdx: index("conversation_whatsapp_phone_idx").on(table.whatsapp_phone),
   statusIdx: index("conversation_status_idx").on(table.status),
   // Composite index for common queries
   orgChannelIdx: index("conversation_org_channel_idx").on(table.organization_id, table.channel),
}));



 // Previous code
 /* export const conversation = pgTable("conversation", {
   id: text("id") 
       .primaryKey()
       .default(sql `gen_random_uuid()`),
    user_email: text("user_email"),
    visitor_ip: text("visitor_ip"),
    name: text("name"),
    chatbot_id: text("chatbot_id").notNull(),
    created_at: text("created_at").default(sql`now()`),
 }); */

 //  Enhanced messages table
export const messages = pgTable("messages", {
   id: text("id").primaryKey().default(sql`gen_random_uuid()`),
   conversation_id: text("conversation_id").notNull(),
   role: text("role").notNull(), // 'user' | 'assistant' | 'system'
   content: text("content").notNull(),
   
   // Rich media support
   message_type: text("message_type").default("text"), // 'text' | 'image' | 'audio' | 'document' | 'video'
   media_url: text("media_url"),
   media_mime_type: text("media_mime_type"),
   
   // WhatsApp specific
   whatsapp_message_id: text("whatsapp_message_id"),
   whatsapp_status: text("whatsapp_status"), // 'sent' | 'delivered' | 'read' | 'failed'
   
   // Human intervention
   is_manual_reply: boolean("is_manual_reply").default(false),
   replied_by_user_id: text("replied_by_user_id"),


  sent_by_human: boolean('sent_by_human').default(false),
  agent_id: text('agent_id'),
  delivery_status: text('delivery_status'), //   
   // Metadata
   metadata: jsonb("metadata"), // { confidence: 0.95, tool_calls: [...] }
   
   created_at: timestamp("created_at", { withTimezone: true }).default(sql`now()`),


}, (table) => ({
   conversationIdx: index("messages_conversation_idx").on(table.conversation_id),
   whatsappMsgIdx: index("messages_whatsapp_id_idx").on(table.whatsapp_message_id),
   createdAtIdx: index("messages_created_at_idx").on(table.created_at),
   roleIdx: index("messages_role_idx").on(table.role),
}));


 export const widgets = pgTable("widgets", {
   id: text("id") 
       .primaryKey()
       .default(sql `gen_random_uuid()`),
   organization_id: text("organization_id").notNull(),
   name:text("name").notNull(),
   allowed_domains:text("allowed_domains").array(),
   status:text("status").notNull().default("active"),
   created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
   
 });

 export const supportTickets = pgTable("supportTickets",{
    id: text("id") 
       .primaryKey()
       .default(sql `gen_random_uuid()`),
       conversation_id: text("conversation_id").notNull(),
       organization_id: text("organization_id").notNull(),
       reason:text("reason").notNull(),
       last_message:text("last_message").notNull(),
       status:text("status").notNull().default("open")
 });


 export const whatsAppTenant = pgTable("whatsAppTenant", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name"),
  
  email: text("email").notNull().unique(),
  organization_id: text("organization_id").notNull(),
  kapsoCustomerId: text("kapsoCustomerId").notNull().unique(),
  bot_enabled: boolean('bot_enabled').default(true), // Global bot on/off
  auto_takeover_on_escalation: boolean('auto_takeover_on_escalation').default(true),
  isWhatsappConnected: boolean("isWhatsappConnected").default(false).notNull(),
  whatsappPhoneNumberId: text("whatsapp_phone_number_id"), // The ID used for sending messages
  whatsappBusinessId: text("whatsapp_business_id"),       // The Meta WABA ID 
},
(table) => {
  return {
    // Primary key already has an index
    emailIdx: uniqueIndex("whatsapp_tenant_email_idx").on(table.email),
    orgIdx: uniqueIndex("whatsapp_tenant_org_idx").on(table.organization_id),
    kapsoIdx: uniqueIndex("whatsapp_tenant_kapso_idx").on(table.kapsoCustomerId),
    // Index for common query patterns
    isConnectedIdx: index("whatsapp_tenant_connected_idx").on(table.isWhatsappConnected),
  }});


export const whatsAppSubscription = pgTable("whatsAppSubscription", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tenant_id: text("tenant_id")
    .notNull()
    .references(() => whatsAppTenant.id, { onDelete: "cascade" }),
  organization_id: text("organization_id").notNull(),
  status: text("status").notNull(), // 'active', 'past_due', 'cancelled'
  plan_id: text("plan_id").notNull(), // Paystack plan_code for WhatsApp
  subscription_id: text("subscription_id"),
  plan_tier: text("plan_tier"), // standard, premium;
  provider: text("provider"), //'stripe', 'paystack'
  paystack_subscription_id: text("paystack_subscription_id"),
  payment_method: text('payment_method'), // Mpesa, Paystack
  current_period_end: timestamp("current_period_end", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
  cancelled_at: timestamp("cancelled_at", { withTimezone: true }).default(sql`now()`),

},
(table) => {
  return {
    // Index for foreign key lookups
    tenantIdx: index("whatsapp_subscription_tenant_idx").on(table.tenant_id),
    
    orgIdx: index("whatsapp_subscription_org_idx").on(table.organization_id),
    
    // Index for status filtering (active, canceled, etc.)
    statusIdx: index("whatsapp_subscription_status_idx").on(table.status),
    
    // Index for subscription expiry queries
    periodEndIdx: index("whatsapp_subscription_period_end_idx").on(table.current_period_end),
    
    // Composite index for common queries
    statusPeriodIdx: index("whatsapp_subscription_status_period_idx").on(
      table.status,
      table.current_period_end
    ),
  };
});










// WhatsApp-specific message queue (for retries/failures)
export const whatsappMessageQueue = pgTable("whatsappMessageQueue", {
   id: text("id").primaryKey().default(sql`gen_random_uuid()`),
   conversation_id: text("conversation_id").notNull(),
   phone_number_id: text("phone_number_id").notNull(),
   to: text("to").notNull(),
   content: text("content").notNull(),
   message_type: text("message_type").default("text"),
   
   status: text("status").notNull().default("pending"), // 'pending' | 'sent' | 'failed'
   retry_count: text("retry_count").default("0"),
   last_error: text("last_error"),
   
   created_at: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
   processed_at: timestamp("processed_at", { withTimezone: true }),
}, (table) => ({
   statusIdx: index("whatsapp_queue_status_idx").on(table.status),
   conversationIdx: index("whatsapp_queue_conversation_idx").on(table.conversation_id),
}));


 // agent activity log (optional )
export const agentActivity = pgTable('agent_activity', {
  id: serial('id').primaryKey(),
  conversation_id: text('conversation_id').references(() => conversation.id),
  agent_id: text('agent_id').notNull(),
  action: text('action').notNull(), // 'takeover', 'release', 'message_sent'
  created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  
});



// appointments


export const appointments = pgTable("appointments", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  conversation_id: text("conversation_id"),
  organization_id: text("organization_id").notNull(),
  
  customer_name: text("customer_name").notNull(),
  customer_email: text("customer_email").notNull(),
  customer_phone: text("customer_phone"),
  
  service_type: text("service_type"), // "demo", "consultation"
  scheduled_at: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  duration_minutes: text("duration_minutes").default("30"),
  
  google_event_id: text("google_event_id"), // For syncing
  google_meet_link: text("google_meet_link"), // Auto-generated
  
  status: text("status").default("confirmed"), // confirmed | cancelled | completed
  reminder_sent: boolean("reminder_sent").default(false),
  created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  notes: text("notes")
}, (table) => ({
  orgIdx: index("appointments_org_idx").on(table.organization_id),
  scheduledIdx: index("appointments_scheduled_idx").on(table.scheduled_at),
  statusIdx: index("appointments_status_idx").on(table.status),
}));




// Database schema for storing Google OAuth tokens
export const googleCalendarConnections = pgTable('google_calendar_connections', {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  organization_id: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }).unique(),
  access_token: text('access_token'),
  refresh_token: text('refresh_token'),
  expiry_date: bigint('expiry_date', { mode: 'number' }),
  status: text('status').default('active').notNull(),
  scope: text('scope').notNull(),
  calendar_id: text('calendar_id').default('primary'),
  email: text('email'),
  created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
});


// === Notification handling=====



// =====================================================
// WEBHOOK LOGS
// =====================================================
export const webhookLogs = pgTable('webhook_logs', {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  org_id: text('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  status: text('status', { enum: ['pending', 'delivered', 'failed', 'error'] }).notNull(),
  status_code: integer('status_code'),
  response_time: integer('response_time'), // in milliseconds
  error_message: text('error_message'),
  payload: jsonb('payload'),
  created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  });

// =====================================================
// NOTIFICATION LOGS (For Auditing)
// =====================================================
export const notificationLogs = pgTable('notification_logs', {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  org_id: text('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  event_type: text('event_type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  channels: text('channels').array().notNull(), // Stores ['sms', 'email', etc]
  created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
});

// =====================================================
// NOTIFICATION SETTINGS
// =====================================================
export const notificationSettings = pgTable('notification_settings', {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  organization_id: text('organization_id')
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Toggle Controls
  email_enabled: boolean('email_enabled').default(true).notNull(),
  sms_enabled: boolean('sms_enabled').default(false).notNull(),
  webhook_enabled: boolean('webhook_enabled').default(false).notNull(),
  
  // Contact Overrides
  notification_phone: text('notification_phone'), 
  notification_email: text('notification_email'),
  
  // Webhook Specifics
  webhook_url: text('notification_webhook'),
  webhook_template: text('webhook_template').default('generic'), // 'slack' | 'discord' | 'generic'
  webhook_verification_status: text('webhook_verification_status').default('unverified'),
  webhook_last_delivered_at: timestamp('webhook_last_delivered_at'),
  
  // Circuit Breaker Fields (Critical for the worker logic)
  webhook_failure_count: integer('webhook_failure_count').default(0).notNull(),
  webhook_retry_at: timestamp('webhook_retry_at'), // When the circuit breaker allows trying again

  created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  
});

// Customer Notifications


// db/schema.ts
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  organization_id: text("organization_id").notNull(),
  type: text("type").notNull(), // 'HOT_LEAD', 'APPOINTMENT', 'ESCALATION'
  title: text("title").notNull(),
  description: text("description").notNull(),
  is_read: boolean("is_read").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});



export const crmSubscription = pgTable("crmSubscription", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organization_id: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // 'active', 'past_due', 'cancelled', 'trialing'
  plan_tier: text("plan_tier").notNull(), // 'free', 'pro'
  plan_id: text("plan_id"), // Paystack plan_code (null for free tier)
  paystack_subscription_id: text("paystack_subscription_id"),
  payment_method: text('payment_method'), // 'mpesa', 'paystack', null for free
  subscription_id: text("plan_id"),
  provider: text("provider"), //'stripe', 'paystack'
  // Feature limits based on tier
  max_contacts: integer("max_contacts").notNull(), // e.g., 1000 for free, unlimited for pro
  max_deals: integer("max_deals").notNull(),
  
  current_period_start: timestamp("current_period_start", { withTimezone: true }).notNull(),
  current_period_end: timestamp("current_period_end", { withTimezone: true }).notNull(),

  created_at: timestamp("created_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
  
  cancelled_at: timestamp("cancelled_at", { withTimezone: true })
  .notNull()
  .default(sql`now()`),
    
},
(table) => {
  return {
    orgIdx: index("crm_subscription_org_idx").on(table.organization_id),
    statusIdx: index("crm_subscription_status_idx").on(table.status),
    periodEndIdx: index("crm_subscription_period_end_idx").on(table.current_period_end),
    statusPeriodIdx: index("crm_subscription_status_period_idx").on(
      table.status,
      table.current_period_end
    ),
  };
});






// Plans

export const whatsAppPlans = pgTable("whatsapp_plans", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  // Plan identifiers
  plan_id: text("plan_id").unique().notNull(), // e.g., 'whatsapp_free_trial', 'whatsapp_basic'
  external_plan_id: text("external_plan_id"), // For payment provider (Paystack plan_code, Stripe price_id)
  
  // Plan details
  name: text("name").notNull(),
  description: text("description"),
  display_name: text("display_name"),
  
  // Pricing
  price: integer("price").notNull().default(0), // Price in cents/pence
  currency: text("currency").notNull().default('USD'),
  billing_interval: text("billing_interval").notNull().default('month'), // 'day', 'week', 'month', 'year'
  trial_period_days: integer("trial_period_days").default(0),
  
  // Features
  features: jsonb("features").notNull().default([]), // Array of feature strings
  limits: jsonb("limits").notNull().default({}), // e.g., { messages_per_month: 1000, whatsapp_numbers: 1 }
  
  // Metadata
  is_active: boolean("is_active").notNull().default(true),
  is_default: boolean("is_default").notNull().default(false),
  sort_order: integer("sort_order").notNull().default(0),
  
  // Provider-specific
  provider: text("provider").notNull().default('paystack'), // 'paystack', 'stripe', 'manual'
  
  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  archived_at: timestamp("archived_at", { withTimezone: true }),
}, (table) => {
  return {
    // Indexes for common queries
    planIdIdx: index("whatsapp_plans_plan_id_idx").on(table.plan_id),
    externalPlanIdIdx: index("whatsapp_plans_external_plan_id_idx").on(table.external_plan_id),
    isActiveIdx: index("whatsapp_plans_is_active_idx").on(table.is_active),
    providerIdx: index("whatsapp_plans_provider_idx").on(table.provider),
    sortOrderIdx: index("whatsapp_plans_sort_order_idx").on(table.sort_order),
  };
});


export const webchatPlans = pgTable("webchat_plans", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  // Plan identifiers
  plan_id: text("plan_id").unique().notNull(), // e.g., 'webchat_free', 'webchat_pro'
  external_plan_id: text("external_plan_id"), // For payment provider
  
  // Plan details
  name: text("name").notNull(),
  description: text("description"),
  display_name: text("display_name"),
  
  // Pricing
  price: integer("price").notNull().default(0), // Price in cents/pence
  currency: text("currency").notNull().default('USD'),
  billing_interval: text("billing_interval").notNull().default('month'),
  trial_period_days: integer("trial_period_days").default(0),
  
  // Features
  features: jsonb("features").notNull().default([]),
  limits: jsonb("limits").notNull().default({}),
  
  // Webchat-specific limits
  max_chats_per_month: integer("max_chats_per_month"),
  max_agents: integer("max_agents"),
  ai_automation: boolean("ai_automation").default(false),
  custom_branding: boolean("custom_branding").default(false),
  custom_domains: integer("custom_domains").default(0),
  integrations: jsonb("integrations").default([]), // ['slack', 'teams', 'zapier']
  
  // Metadata
  is_active: boolean("is_active").notNull().default(true),
  is_default: boolean("is_default").notNull().default(false),
  sort_order: integer("sort_order").notNull().default(0),
  
  // Provider-specific
  provider: text("provider").notNull().default('paystack'),
  
  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  archived_at: timestamp("archived_at", { withTimezone: true }),
}, (table) => {
  return {
    planIdIdx: index("webchat_plans_plan_id_idx").on(table.plan_id),
    externalPlanIdIdx: index("webchat_plans_external_plan_id_idx").on(table.external_plan_id),
    isActiveIdx: index("webchat_plans_is_active_idx").on(table.is_active),
    providerIdx: index("webchat_plans_provider_idx").on(table.provider),
    sortOrderIdx: index("webchat_plans_sort_order_idx").on(table.sort_order),
    priceIdx: index("webchat_plans_price_idx").on(table.price),
  };
});

