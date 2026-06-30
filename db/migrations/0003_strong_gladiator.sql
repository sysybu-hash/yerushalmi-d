ALTER TABLE "ai_media_assets" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "media_gallery" jsonb;