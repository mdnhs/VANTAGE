ALTER TABLE "site_settings" ADD COLUMN "meta_title" varchar(255);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "meta_description" varchar(500);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "og_image_public_id" varchar(500);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "twitter_handle" varchar(50);