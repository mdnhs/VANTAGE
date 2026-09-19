ALTER TABLE "site_settings" ADD COLUMN "logo_lottie_json" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "logo_use_lottie" boolean DEFAULT false NOT NULL;