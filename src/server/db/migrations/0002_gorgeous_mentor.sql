CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"description" text NOT NULL,
	"icon_public_id" varchar(255),
	"starting_price" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "services_slug_idx" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "services_enabled_order_idx" ON "services" USING btree ("is_enabled","display_order");