ALTER TABLE "quote_requests" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "city" varchar(80);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "eircode" varchar(20);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "assigned_admin_id" uuid;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "inspection_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "payment_status" varchar(40) DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "paid_amount" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "payment_method" varchar(60);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "invoice_number" varchar(60);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_assigned_admin_id_admin_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quote_requests_assigned_admin_idx" ON "quote_requests" USING btree ("assigned_admin_id");--> statement-breakpoint
CREATE INDEX "quote_requests_payment_status_idx" ON "quote_requests" USING btree ("payment_status");