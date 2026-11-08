CREATE TABLE "support_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"visitor_name" varchar(120),
	"visitor_email" varchar(254),
	"source_path" varchar(500),
	"assigned_to" text,
	"assigned_at" timestamp with time zone,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_preview" varchar(160),
	"last_visitor_message_at" timestamp with time zone,
	"staff_read_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_conversations_status_check" CHECK ("support_conversations"."status" in ('open','closed'))
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender" varchar(16) NOT NULL,
	"sender_user_id" text,
	"sender_name" varchar(120),
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_messages_sender_check" CHECK ("support_messages"."sender" in ('visitor','staff','system'))
);
--> statement-breakpoint
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_conversation_id_support_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."support_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "support_conversations_token_hash_idx" ON "support_conversations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "support_conversations_status_last_idx" ON "support_conversations" USING btree ("status","last_message_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "support_conversations_assigned_idx" ON "support_conversations" USING btree ("assigned_to","status");--> statement-breakpoint
CREATE INDEX "support_messages_conversation_idx" ON "support_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "support_messages_sender_user_idx" ON "support_messages" USING btree ("sender_user_id");