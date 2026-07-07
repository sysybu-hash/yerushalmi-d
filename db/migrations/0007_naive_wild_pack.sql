CREATE TABLE "studio_quota_counters" (
	"day" date NOT NULL,
	"scope_key" varchar(20) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "studio_quota_counters_day_scope_key_pk" PRIMARY KEY("day","scope_key")
);
