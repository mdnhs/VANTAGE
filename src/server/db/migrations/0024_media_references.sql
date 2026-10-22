CREATE TABLE "enquiry_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_request_id" uuid,
	"contact_message_id" uuid,
	"media_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enquiry_photos_one_parent" CHECK (("enquiry_photos"."quote_request_id" is not null)::int + ("enquiry_photos"."contact_message_id" is not null)::int = 1)
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "before_image_public_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "after_image_public_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "project_gallery_images" ALTER COLUMN "image_public_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "partner_logos" ALTER COLUMN "logo_public_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "icon_media_id" uuid;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image_media_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "before_image_media_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "after_image_media_id" uuid;--> statement-breakpoint
ALTER TABLE "project_gallery_images" ADD COLUMN "media_id" uuid;--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "avatar_media_id" uuid;--> statement-breakpoint
ALTER TABLE "partner_logos" ADD COLUMN "logo_media_id" uuid;--> statement-breakpoint
ALTER TABLE "homepage_catalogs" ADD COLUMN "icon_media_id" uuid;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "scope" text DEFAULT 'library' NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "legacy_source" text;--> statement-breakpoint
ALTER TABLE "enquiry_photos" ADD CONSTRAINT "enquiry_photos_quote_request_id_quote_requests_id_fk" FOREIGN KEY ("quote_request_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_photos" ADD CONSTRAINT "enquiry_photos_contact_message_id_contact_messages_id_fk" FOREIGN KEY ("contact_message_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_photos" ADD CONSTRAINT "enquiry_photos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enquiry_photos_quote_request_idx" ON "enquiry_photos" USING btree ("quote_request_id");--> statement-breakpoint
CREATE INDEX "enquiry_photos_contact_message_idx" ON "enquiry_photos" USING btree ("contact_message_id");--> statement-breakpoint
CREATE INDEX "enquiry_photos_media_idx" ON "enquiry_photos" USING btree ("media_id");--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_icon_media_id_media_id_fk" FOREIGN KEY ("icon_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_image_media_id_media_id_fk" FOREIGN KEY ("image_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_before_image_media_id_media_id_fk" FOREIGN KEY ("before_image_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_after_image_media_id_media_id_fk" FOREIGN KEY ("after_image_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_gallery_images" ADD CONSTRAINT "project_gallery_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatar_media_id_media_id_fk" FOREIGN KEY ("avatar_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_logos" ADD CONSTRAINT "partner_logos_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_catalogs" ADD CONSTRAINT "homepage_catalogs_icon_media_id_media_id_fk" FOREIGN KEY ("icon_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_scope_idx" ON "media" USING btree ("scope");--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_legacy_source_unique" UNIQUE("legacy_source");