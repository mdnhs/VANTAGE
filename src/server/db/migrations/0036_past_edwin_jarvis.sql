ALTER TABLE "support_messages" DROP CONSTRAINT "support_messages_sender_check";--> statement-breakpoint
ALTER TABLE "support_conversations" ADD COLUMN "ai_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "support_conversations" ADD COLUMN "needs_human" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_check" CHECK ("support_messages"."sender" in ('visitor','staff','system','ai'));