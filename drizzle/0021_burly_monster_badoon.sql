CREATE TABLE "whatsapp_plans" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"external_plan_id" text,
	"name" text NOT NULL,
	"description" text,
	"display_name" text,
	"price" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"billing_interval" text DEFAULT 'month' NOT NULL,
	"trial_period_days" integer DEFAULT 0,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"provider" text DEFAULT 'paystack' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "whatsapp_plans_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE INDEX "whatsapp_plans_plan_id_idx" ON "whatsapp_plans" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "whatsapp_plans_external_plan_id_idx" ON "whatsapp_plans" USING btree ("external_plan_id");--> statement-breakpoint
CREATE INDEX "whatsapp_plans_is_active_idx" ON "whatsapp_plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "whatsapp_plans_provider_idx" ON "whatsapp_plans" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "whatsapp_plans_sort_order_idx" ON "whatsapp_plans" USING btree ("sort_order");