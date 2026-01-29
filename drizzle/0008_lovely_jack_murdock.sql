ALTER TABLE "conversation" ADD COLUMN "crm_contact_id" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "crm_company_id" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "crm_synced" text DEFAULT 'false';--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "crm_synced_at" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "lead_score" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "lead_quality" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "visitor_email" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "visitor_company" text;