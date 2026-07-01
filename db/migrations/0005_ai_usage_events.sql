CREATE TABLE "ai_usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"provider" varchar(20) NOT NULL,
	"capability" varchar(20) NOT NULL,
	"model_id" varchar(200) NOT NULL,
	"mode" varchar(20) DEFAULT 'catalog' NOT NULL,
	"success" boolean NOT NULL,
	"duration_ms" integer,
	"estimated_cost_usd" numeric(10, 6),
	"billed_units" numeric(12, 4),
	"cached" boolean DEFAULT false NOT NULL,
	"project_id" integer,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_project_id_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_projects"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "ai_usage_events_created_at_idx" ON "ai_usage_events" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "ai_usage_events_provider_capability_created_at_idx" ON "ai_usage_events" USING btree ("provider","capability","created_at");
