ALTER TABLE "site_settings" ADD COLUMN "insurance_hero_eyebrow" varchar(200);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_hero_line1" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_hero_line2" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_hero_line3" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_hero_subtext" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_coordination_title" varchar(160);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_coordination_subtext" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_features" jsonb;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_steps_eyebrow" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_steps_title" varchar(160);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_steps" jsonb;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_cta_line1" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_cta_accent" varchar(100);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_cta_subtext" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "insurance_disclaimer" text;