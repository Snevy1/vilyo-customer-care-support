ALTER TABLE "whatsAppSubscription" ALTER COLUMN "plan_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ADD COLUMN "subscription_id" text;