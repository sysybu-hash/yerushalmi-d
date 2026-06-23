CREATE TYPE "public"."studio_project_status" AS ENUM('draft', 'in_progress', 'ready', 'published');--> statement-breakpoint
CREATE TABLE "studio_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'עבודה חדשה' NOT NULL,
	"status" "studio_project_status" DEFAULT 'draft' NOT NULL,
	"thumbnail_url" text,
	"snapshot" jsonb NOT NULL,
	"published_product_id" integer,
	"published_setting_key" varchar(100),
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_published_product_id_products_id_fk" FOREIGN KEY ("published_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;