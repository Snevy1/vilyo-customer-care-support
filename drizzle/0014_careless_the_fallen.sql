CREATE TABLE "whatsAppTenant" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"organization_id" text NOT NULL,
	"kapsoCustomerId" text NOT NULL,
	"isWhatsappConnected" boolean DEFAULT false NOT NULL,
	CONSTRAINT "whatsAppTenant_email_unique" UNIQUE("email"),
	CONSTRAINT "whatsAppTenant_kapsoCustomerId_unique" UNIQUE("kapsoCustomerId")
);
