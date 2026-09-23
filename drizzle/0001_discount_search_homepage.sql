CREATE TABLE "homepage_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "discount_price_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "homepage_images" ADD CONSTRAINT "homepage_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "homepage_images_media_idx" ON "homepage_images" USING btree ("media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "homepage_images_one_primary_idx" ON "homepage_images" USING btree ("is_primary") WHERE "homepage_images"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "homepage_images_sort_idx" ON "homepage_images" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_discount_nonnegative" CHECK ("products"."discount_price_amount" is null or "products"."discount_price_amount" >= 0);--> statement-breakpoint
INSERT INTO "homepage_images" ("media_id", "sort_order", "is_primary")
SELECT "hero_media_id", 0, true
FROM "homepage_content"
WHERE "hero_media_id" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "homepage_images");--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_description_trgm_idx" ON "products" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_sku_trgm_idx" ON "products" USING gin ("sku" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_name_trgm_idx" ON "categories" USING gin ("name" gin_trgm_ops);