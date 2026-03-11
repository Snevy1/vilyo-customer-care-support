ALTER TABLE "payment_processor" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_processor" ADD COLUMN "is_top_priority" boolean DEFAULT false NOT NULL;