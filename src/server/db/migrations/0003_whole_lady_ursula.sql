CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"vehicle_model" varchar(120) NOT NULL,
	"service_category" varchar(80) NOT NULL,
	"before_image_public_id" varchar(255) NOT NULL,
	"after_image_public_id" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"completed_at" timestamp with time zone,
	"is_featured" boolean DEFAULT false NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_gallery_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"image_public_id" varchar(255) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_gallery_images" ADD CONSTRAINT "project_gallery_images_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_status_order_idx" ON "projects" USING btree ("status","display_order");--> statement-breakpoint
CREATE INDEX "projects_featured_status_idx" ON "projects" USING btree ("is_featured","status");--> statement-breakpoint
CREATE INDEX "project_gallery_images_project_id_idx" ON "project_gallery_images" USING btree ("project_id");