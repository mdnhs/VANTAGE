ALTER TABLE "services" ADD COLUMN "seo_title" varchar(70);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "seo_description" varchar(200);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "og_title" varchar(70);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "og_description" varchar(200);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "og_image_media_id" uuid;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "canonical" varchar(300);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "noindex" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "seo_title" varchar(70);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "seo_description" varchar(200);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "og_title" varchar(70);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "og_description" varchar(200);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "og_image_media_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "canonical" varchar(300);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "noindex" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "legal_pages" ADD COLUMN "seo_title" varchar(70);--> statement-breakpoint
ALTER TABLE "legal_pages" ADD COLUMN "seo_description" varchar(200);--> statement-breakpoint
ALTER TABLE "legal_pages" ADD COLUMN "og_title" varchar(70);--> statement-breakpoint
ALTER TABLE "legal_pages" ADD COLUMN "og_description" varchar(200);--> statement-breakpoint
ALTER TABLE "legal_pages" ADD COLUMN "og_image_media_id" uuid;--> statement-breakpoint
ALTER TABLE "legal_pages" ADD COLUMN "canonical" varchar(300);--> statement-breakpoint
ALTER TABLE "legal_pages" ADD COLUMN "noindex" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_og_image_media_id_media_id_fk" FOREIGN KEY ("og_image_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_og_image_media_id_media_id_fk" FOREIGN KEY ("og_image_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_pages" ADD CONSTRAINT "legal_pages_og_image_media_id_media_id_fk" FOREIGN KEY ("og_image_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;