CREATE TABLE "ai_media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_type" text NOT NULL,
	"original_url" text NOT NULL,
	"generated_url" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
