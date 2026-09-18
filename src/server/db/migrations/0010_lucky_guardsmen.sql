CREATE TABLE "homepage_catalogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"badge" varchar(80),
	"footnote" varchar(80) DEFAULT 'Free Estimate',
	"icon" varchar(40) DEFAULT 'car-front' NOT NULL,
	"icon_public_id" varchar(255),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "homepage_catalogs_display_order_idx" ON "homepage_catalogs" USING btree ("display_order");