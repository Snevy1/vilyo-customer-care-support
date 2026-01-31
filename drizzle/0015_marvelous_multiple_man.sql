CREATE TABLE "whatsAppSubscription" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"status" text NOT NULL,
	"plan_id" text NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsAppSubscription" ADD CONSTRAINT "whatsAppSubscription_tenant_id_whatsAppTenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."whatsAppTenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_subscription_tenant_idx" ON "whatsAppSubscription" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "whatsapp_subscription_org_idx" ON "whatsAppSubscription" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "whatsapp_subscription_status_idx" ON "whatsAppSubscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "whatsapp_subscription_period_end_idx" ON "whatsAppSubscription" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "whatsapp_subscription_status_period_idx" ON "whatsAppSubscription" USING btree ("status","current_period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_tenant_email_idx" ON "whatsAppTenant" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_tenant_org_idx" ON "whatsAppTenant" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_tenant_kapso_idx" ON "whatsAppTenant" USING btree ("kapsoCustomerId");--> statement-breakpoint
CREATE INDEX "whatsapp_tenant_connected_idx" ON "whatsAppTenant" USING btree ("isWhatsappConnected");