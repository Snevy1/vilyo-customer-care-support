CREATE TABLE "supportTickets" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"reason" text NOT NULL,
	"last_message" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL
);
