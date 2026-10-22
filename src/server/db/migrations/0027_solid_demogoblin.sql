CREATE TABLE "redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_path" text NOT NULL,
	"destination" text NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL,
	"last_hit_at" timestamp with time zone,
	"note" text DEFAULT '' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_source_path_unique" UNIQUE("source_path"),
	CONSTRAINT "redirects_status_code_check" CHECK ("redirects"."status_code" in (301, 302, 307, 308)),
	CONSTRAINT "redirects_source_not_destination_check" CHECK ("redirects"."source_path" <> "redirects"."destination")
);
--> statement-breakpoint
CREATE INDEX "redirects_is_active_idx" ON "redirects" USING btree ("is_active");