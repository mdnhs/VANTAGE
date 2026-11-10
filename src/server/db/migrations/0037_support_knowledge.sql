CREATE TABLE "support_knowledge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(40) NOT NULL,
	"source_key" varchar(200) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"core" boolean DEFAULT false NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_knowledge_sync" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"status" varchar(16) DEFAULT 'idle' NOT NULL,
	"step" varchar(120),
	"total" integer DEFAULT 0 NOT NULL,
	"done" integer DEFAULT 0 NOT NULL,
	"chunks" integer DEFAULT 0 NOT NULL,
	"error" varchar(300),
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"started_by" text,
	CONSTRAINT "support_knowledge_sync_status_check" CHECK ("support_knowledge_sync"."status" in ('idle','running','done','failed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "support_knowledge_source_key_idx" ON "support_knowledge" USING btree ("source","source_key");