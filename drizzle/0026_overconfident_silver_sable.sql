CREATE TYPE "public"."payment_environment" AS ENUM('production', 'test', 'sandbox');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'paypal', 'paystack', 'flutterwave', 'mpesa');--> statement-breakpoint
CREATE TABLE "payment_processor" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text,
	"organization_id" text,
	"provider" "payment_provider" NOT NULL,
	"code" text NOT NULL,
	"display_name" text NOT NULL,
	"logo_url" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"supported_currencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"environment" "payment_environment" DEFAULT 'production' NOT NULL,
	"credentials" jsonb,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"audit_log" jsonb DEFAULT '[]'::jsonb,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "payment_processor_unique" UNIQUE("provider","tenant_id","code")
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "paypal_customer_id" text;--> statement-breakpoint
ALTER TABLE "payment_processor" ADD CONSTRAINT "payment_processor_tenant_id_whatsAppTenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."whatsAppTenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_processor_tenant_idx" ON "payment_processor" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "payment_processor_provider_idx" ON "payment_processor" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "payment_processor_enabled_idx" ON "payment_processor" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "payment_processor_tenant_enabled_idx" ON "payment_processor" USING btree ("tenant_id","is_enabled");