CREATE TABLE "whatsappMessageQueue" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" text NOT NULL,
	"phone_number_id" text NOT NULL,
	"to" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"status" text DEFAULT 'pending' NOT NULL,
	"retry_count" text DEFAULT '0',
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "conversation" ALTER COLUMN "crm_synced" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "conversation" ALTER COLUMN "crm_synced_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversation" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversation" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "chatBotMetadata" ADD COLUMN "channels" text[] DEFAULT ARRAY['web']::text[];--> statement-breakpoint
ALTER TABLE "chatBotMetadata" ADD COLUMN "whatsapp_settings" jsonb;--> statement-breakpoint
ALTER TABLE "chatBotMetadata" ADD COLUMN "web_settings" jsonb;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "channel" text DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "whatsapp_phone" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "session_token" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "assigned_to" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "message_type" text DEFAULT 'text';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_mime_type" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "whatsapp_message_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "whatsapp_status" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_manual_reply" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "replied_by_user_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "whatsAppTenant" ADD COLUMN "whatsapp_phone_number_id" text;--> statement-breakpoint
ALTER TABLE "whatsAppTenant" ADD COLUMN "whatsapp_business_id" text;--> statement-breakpoint
CREATE INDEX "whatsapp_queue_status_idx" ON "whatsappMessageQueue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "whatsapp_queue_conversation_idx" ON "whatsappMessageQueue" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "chatbot_org_idx" ON "chatBotMetadata" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "conversation_channel_idx" ON "conversation" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "conversation_org_idx" ON "conversation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "conversation_chatbot_idx" ON "conversation" USING btree ("chatbot_id");--> statement-breakpoint
CREATE INDEX "conversation_whatsapp_phone_idx" ON "conversation" USING btree ("whatsapp_phone");--> statement-breakpoint
CREATE INDEX "conversation_status_idx" ON "conversation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversation_org_channel_idx" ON "conversation" USING btree ("organization_id","channel");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_whatsapp_id_idx" ON "messages" USING btree ("whatsapp_message_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "messages_role_idx" ON "messages" USING btree ("role");