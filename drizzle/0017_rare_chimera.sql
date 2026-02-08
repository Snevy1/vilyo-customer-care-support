CREATE TABLE "agent_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" text,
	"agent_id" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" text,
	"organization_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"service_type" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" text DEFAULT '30',
	"google_event_id" text,
	"google_meet_link" text,
	"status" text DEFAULT 'confirmed',
	"reminder_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "crmSubscription" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"status" text NOT NULL,
	"plan_tier" text NOT NULL,
	"plan_id" text,
	"paystack_subscription_id" text,
	"payment_method" text,
	"provider" text,
	"max_contacts" integer NOT NULL,
	"max_deals" integer NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "google_calendar_connections" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expiry_date" bigint,
	"scope" text NOT NULL,
	"calendar_id" text DEFAULT 'primary',
	"email" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "google_calendar_connections_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"channels" text[] NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"webhook_enabled" boolean DEFAULT false NOT NULL,
	"notification_phone" text,
	"notification_email" text,
	"notification_webhook" text,
	"webhook_template" text DEFAULT 'generic',
	"webhook_verification_status" text DEFAULT 'unverified',
	"webhook_last_delivered_at" timestamp,
	"webhook_failure_count" integer DEFAULT 0 NOT NULL,
	"webhook_retry_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"web_chat_plan" text DEFAULT 'free' NOT NULL,
	"web_chat_subscription_id" text,
	"web_chat_status" text DEFAULT 'active',
	"web_chat_period_end" timestamp with time zone,
	"web_chat_payment_method" text,
	"web_chat_provider" text,
	"web_chat_created_at" timestamp with time zone,
	"web_chat_cancelled_at" timestamp with time zone,
	"web_chat_updated_at" timestamp with time zone,
	"owner_email" text NOT NULL,
	"owner_phone" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"url" text NOT NULL,
	"status" text NOT NULL,
	"status_code" integer,
	"response_time" integer,
	"error_message" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ALTER COLUMN "plan_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chatBotMetadata" ADD COLUMN "bot_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "is_human_takeover" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "human_agent_id" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "takeover_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "sent_by_human" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "agent_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "delivery_status" text;--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ADD COLUMN "plan_tier" text;--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ADD COLUMN "provider" text;--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ADD COLUMN "paystack_subscription_id" text;--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ADD COLUMN "cancelled_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "whatsAppTenant" ADD COLUMN "bot_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "whatsAppTenant" ADD COLUMN "auto_takeover_on_escalation" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "agent_activity" ADD CONSTRAINT "agent_activity_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crmSubscription" ADD CONSTRAINT "crmSubscription_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_calendar_connections" ADD CONSTRAINT "google_calendar_connections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_org_idx" ON "appointments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "appointments_scheduled_idx" ON "appointments" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_subscription_org_idx" ON "crmSubscription" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "crm_subscription_status_idx" ON "crmSubscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_subscription_period_end_idx" ON "crmSubscription" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "crm_subscription_status_period_idx" ON "crmSubscription" USING btree ("status","current_period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_email_idx" ON "organizations" USING btree ("email");