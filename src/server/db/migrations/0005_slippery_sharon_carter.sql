CREATE TABLE "partner_logos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(120) NOT NULL,
	"logo_public_id" varchar(255) NOT NULL,
	"website_url" varchar(255),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "partner_logos_enabled_order_idx" ON "partner_logos" USING btree ("is_enabled","display_order");