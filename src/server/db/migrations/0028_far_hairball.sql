CREATE TABLE "media_object_purges" (
	"key" text PRIMARY KEY NOT NULL,
	"reason" varchar(16) NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_object_purges_reason_check" CHECK ("media_object_purges"."reason" in ('replaced', 'deleted'))
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "spam_reason" varchar(40);--> statement-breakpoint
ALTER TABLE "contact_messages" ADD COLUMN "spam_reason" varchar(40);--> statement-breakpoint
CREATE INDEX "media_object_purges_due_at_idx" ON "media_object_purges" USING btree ("due_at");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_created_by_idx" ON "projects" USING btree ("created_by");