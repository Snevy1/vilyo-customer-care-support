CREATE TABLE "fullSubscription" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text,
	"organization_id" text NOT NULL,
	"status" text NOT NULL,
	"plan_id" text NOT NULL,
	"subscription_id" text,
	"plan_tier" text,
	"provider" text,
	"paystack_subscription_id" text,
	"payment_method" text,
	"current_period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ALTER COLUMN "tenant_id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "full_sub_tenant_idx" ON "fullSubscription" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "full_sub_org_idx" ON "fullSubscription" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "full_sub_status_idx" ON "fullSubscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "full_sub_period_end_idx" ON "fullSubscription" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "full_sub_status_period_idx" ON "fullSubscription" USING btree ("status","current_period_end");