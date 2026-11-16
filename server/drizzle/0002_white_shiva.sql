ALTER TABLE "revoked_tokens" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "revoked_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "downloads" DROP CONSTRAINT "downloads_user_id_product_id_pk";--> statement-breakpoint
ALTER TABLE "downloads" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "downloads" ADD COLUMN "order_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_user_id_product_id_unique" UNIQUE("user_id","product_id");