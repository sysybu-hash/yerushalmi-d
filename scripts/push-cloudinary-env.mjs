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
    stdio: "pipe",
    shell: false,
  });
  const result = spawnSync("vercel", ["env", "add", name, environment], {
    input: value,
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) {
    const err = result.stderr?.toString() || result.stdout?.toString() || "";
    throw new Error(`vercel env add ${name} failed: ${err}`);
  }
  console.log(`✓ ${name} → Vercel (${environment})`);
}

const envPath = join(process.cwd(), ".env.local");
const env = parseEnvFile(envPath);

let key = env.CLOUDINARY_API_KEY?.trim();
let secret = env.CLOUDINARY_API_SECRET?.trim();

const cloudinaryUrl = env.CLOUDINARY_URL?.trim();
if (cloudinaryUrl && (!key || !secret)) {
  try {
    const parsed = new URL(cloudinaryUrl);
    if (parsed.protocol === "cloudinary:") {
      key = key || decodeURIComponent(parsed.username);
      secret = secret || decodeURIComponent(parsed.password);
    }
  } catch {
    /* ignore */
  }
}

const missing = [];
if (!key) missing.push("CLOUDINARY_API_KEY");
if (!secret) missing.push("CLOUDINARY_API_SECRET");

if (missing.length > 0) {
  console.error(
    `חסר ב-.env.local: ${missing.join(", ")}\n\n` +
      "1. פתח https://console.cloudinary.com → Settings → API Keys\n" +
      "2. לחץ Reveal ליד API Secret\n" +
      "3. הדבק ב-.env.local בשורה:\n" +
      "   CLOUDINARY_API_SECRET=הסוד_שהעתקת\n\n" +
      "או שורה אחת:\n" +
      "   CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@djohcg6ig\n"
  );
  process.exit(1);
}

upsertVercelEnv("CLOUDINARY_API_KEY", key);
upsertVercelEnv("CLOUDINARY_API_SECRET", secret, "production");
console.log("\nעכשיו הרץ: vercel --prod");
