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
        created_at: text("created_at").default(sql`now()`),   
}); 

// organization
export const organizations = pgTable("organizations", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  timezone: text('timezone').default('UTC').notNull(),
  owner_email: text("owner_email").notNull(),
  owner_phone: text('owner_phone'),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
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
        created_at: text("created_at").default(sql `now()`),
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
    created_at: text("created_at").default(sql `now()`),


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
    created_at: text("created_at").default(sql `now()`),

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
    
    created_at: text("created_at").default(sql`now()`),
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
    created_at: text("created_at").default(sql`now()`)
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
   created_at: text("created_at").default(sql`now()`),
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
  status: text("status").notNull(),
  plan_id: text("plan_id").notNull(),
  current_period_end: timestamp("current_period_end", { withTimezone: true }).notNull(),
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
  created_at: timestamp('created_at').defaultNow().notNull(),
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
  
  created_at: timestamp("created_at").default(sql`now()`),
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
  scope: text('scope').notNull(),
  calendar_id: text('calendar_id').default('primary'),
  email: text('email'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
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
  created_at: timestamp('created_at').defaultNow(),
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
  created_at: timestamp('created_at').defaultNow(),
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
  
  updated_at: timestamp('updated_at').defaultNow(),
});