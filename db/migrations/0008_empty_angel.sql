CREATE TABLE "studio_beta_action_locks" (
	"key" varchar(160) PRIMARY KEY NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"result_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
