CREATE TABLE "studio_beta_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'עבודה חדשה' NOT NULL,
	"source_image_url" text NOT NULL,
	"thumbnail_url" text,
	"state" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
