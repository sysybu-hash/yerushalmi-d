import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

dotenv.config({ path: ".env.local" });

const migrationsDir = path.join(process.cwd(), "db", "migrations");
const journal = JSON.parse(
  fs.readFileSync(path.join(migrationsDir, "meta", "_journal.json"), "utf8")
);

function migrationHash(tag) {
  const file = path.join(migrationsDir, `${tag}.sql`);
  const sql = fs.readFileSync(file, "utf8");
  return crypto.createHash("sha256").update(sql).digest("hex");
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

await client.query("CREATE SCHEMA IF NOT EXISTS drizzle");
await client.query(`
  CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )
`);

const { rows: applied } = await client.query(
  "SELECT hash FROM drizzle.__drizzle_migrations"
);
const appliedHashes = new Set(applied.map((r) => r.hash));

const products = await client.query(
  "SELECT to_regclass('public.products') AS exists"
);
const dbHasData = Boolean(products.rows[0]?.exists);

const usage = await client.query(
  "SELECT to_regclass('public.ai_usage_events') AS exists"
);
const hasUsageTable = Boolean(usage.rows[0]?.exists);

for (const entry of journal.entries) {
  const tag = entry.tag;
  const hash = migrationHash(tag);
  if (appliedHashes.has(hash)) continue;

  const file = path.join(migrationsDir, `${tag}.sql`);
  const sql = fs.readFileSync(file, "utf8");
  const statements = sql
    .split(/--> statement-breakpoint\n?/)
    .map((s) => s.trim())
    .filter(Boolean);

  const isLegacy = tag !== "0005_ai_usage_events";

  if (isLegacy && dbHasData) {
    await client.query(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
      [hash, Date.now()]
    );
    console.log(`baselined ${tag}`);
    continue;
  }

  if (tag === "0005_ai_usage_events" && hasUsageTable) {
    await client.query(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
      [hash, Date.now()]
    );
    console.log(`baselined ${tag} (table already exists)`);
    continue;
  }

  for (const statement of statements) {
    await client.query(statement);
  }

  await client.query(
    "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
    [hash, Date.now()]
  );
  console.log(`applied ${tag}`);
}

await client.end();
console.log("db migrate complete");
