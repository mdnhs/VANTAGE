CREATE TABLE "homepage_pillars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(40) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homepage_process_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"is_highlighted" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "hero_eyebrow" varchar(200);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "hero_headline_line1" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "hero_headline_line2" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "hero_headline_accent" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "hero_subtext" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "trust_badge1_title" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "trust_badge1_subtitle" varchar(150);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "trust_badge2_title" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "trust_badge2_subtitle" varchar(150);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "trust_badge3_title" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "trust_badge3_subtitle" varchar(150);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "trust_badge4_title" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "trust_badge4_subtitle" varchar(150);--> statement-breakpoint
CREATE INDEX "homepage_pillars_display_order_idx" ON "homepage_pillars" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "homepage_process_steps_display_order_idx" ON "homepage_process_steps" USING btree ("display_order");