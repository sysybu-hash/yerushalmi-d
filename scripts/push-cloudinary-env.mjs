/**
 * דוחף CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET מ-.env.local ל-Vercel Production.
 * הרצה: node scripts/push-cloudinary-env.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

function parseEnvFile(path) {
  const text = readFileSync(path, "utf8");
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function upsertVercelEnv(name, value, environment = "production") {
  spawnSync("vercel", ["env", "rm", name, environment, "--yes"], {
    stdio: "inherit",
    shell: true,
  });
  const result = spawnSync(
    "vercel",
    ["env", "add", name, environment],
    {
      input: value,
      encoding: "utf8",
      shell: true,
    }
  );
  if (result.status !== 0) {
    throw new Error(`vercel env add ${name} failed`);
  }
  console.log(`✓ ${name} → Vercel (${environment})`);
}

const envPath = join(process.cwd(), ".env.local");
const env = parseEnvFile(envPath);

const key = env.CLOUDINARY_API_KEY?.trim();
const secret = env.CLOUDINARY_API_SECRET?.trim();

if (!key || !secret) {
  console.error(
    "חסרים CLOUDINARY_API_KEY או CLOUDINARY_API_SECRET ב-.env.local\n" +
      "פתח Cloudinary → API Keys → Reveal והדבק את CLOUDINARY_API_SECRET."
  );
  process.exit(1);
}

upsertVercelEnv("CLOUDINARY_API_KEY", key);
upsertVercelEnv("CLOUDINARY_API_SECRET", secret, "production");
console.log("\nעכשיו הרץ: vercel --prod");
