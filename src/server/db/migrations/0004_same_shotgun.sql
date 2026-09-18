CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" varchar(120) NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text NOT NULL,
	"avatar_public_id" varchar(255),
	"service_received" varchar(120),
	"received_at" timestamp with time zone,
	"is_featured" boolean DEFAULT false NOT NULL,
	"status" varchar(16) DEFAULT 'published' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "testimonials_status_order_idx" ON "testimonials" USING btree ("status","display_order");