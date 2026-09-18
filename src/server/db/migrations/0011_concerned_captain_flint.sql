CREATE TABLE "quote_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"registration" varchar(40),
	"make" varchar(80),
	"model" varchar(80),
	"year" integer,
	"service_type" varchar(120),
	"description" text,
	"photo_urls" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(40) DEFAULT 'new' NOT NULL,
	"estimated_cost" numeric(10, 2),
	"admin_notes" text,
	"source" varchar(60) DEFAULT 'website' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "quote_requests_status_idx" ON "quote_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quote_requests_created_at_idx" ON "quote_requests" USING btree ("created_at");