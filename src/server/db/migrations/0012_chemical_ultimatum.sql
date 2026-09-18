ALTER TABLE "services" ADD COLUMN "image_public_id" varchar(255);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "checklist" text[] DEFAULT '{}' NOT NULL;