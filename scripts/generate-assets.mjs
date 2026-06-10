/**
 * סקריפט חד-פעמי: ייצור תמונות מותג ב-Replicate SDXL,
 * העלאה ל-Cloudinary, ושמירת הכתובות בטבלת site_settings ב-Neon.
 *
 * הרצה:  node --env-file=.env.local scripts/generate-assets.mjs [keys...]
 * בלי ארגומנטים — מייצר את כולן; עם ארגומנטים — רק את המפתחות שצוינו.
 */

import Replicate from "replicate";
import { neon } from "@neondatabase/serverless";
import { writeFileSync, mkdirSync } from "node:fs";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const sql = neon(process.env.DATABASE_URL);

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const BASE_STYLE =
  "professional luxury jewelry product photography, cinematic studio lighting, ultra detailed, 8k, photorealistic, elegant, no people, no hands, no text, no watermark";

const NEGATIVE =
  "people, person, hands, fingers, face, skin, text, watermark, logo, letters, blurry, low quality, cartoon, painting, deformed";

/** מפתח-הגדרה ← הגדרות יצירה */
const ASSETS = {
  heroImage: {
    prompt: `breathtaking solitaire diamond ring resting on black velvet, dramatic rim lighting, sparkling diamond facets catching light, dark moody atmosphere with champagne gold bokeh in background, wide cinematic composition, ${BASE_STYLE}`,
    width: 1536,
    height: 640,
  },
  categoryRingsImage: {
    prompt: `elegant diamond engagement ring on dark polished marble surface, soft golden side lighting, shallow depth of field, vertical composition, ${BASE_STYLE}`,
    width: 768,
    height: 960,
  },
  categoryBraceletsImage: {
    prompt: `luxurious diamond tennis bracelet draped over black silk fabric, glittering diamonds, warm champagne lighting accents, vertical composition, ${BASE_STYLE}`,
    width: 768,
    height: 960,
  },
  categoryNecklacesImage: {
    prompt: `stunning diamond pendant necklace on dark velvet jewelry display bust, single solitaire diamond pendant, moody elegant lighting, vertical composition, ${BASE_STYLE}`,
    width: 768,
    height: 960,
  },
  categoryCustomImage: {
    prompt: `jewelry design concept: loose brilliant cut diamonds and gold band components arranged on black leather sketchbook with elegant pencil sketch of a ring design, goldsmith workshop ambiance, vertical composition, ${BASE_STYLE}`,
    width: 768,
    height: 960,
  },
  aboutImage: {
    prompt: `goldsmith workbench still life: vintage jewelers loupe, polishing tools, loose rough and polished diamonds scattered on dark worn leather surface, warm workshop lighting, heritage craftsmanship atmosphere, vertical composition, ${BASE_STYLE}`,
    width: 768,
    height: 960,
  },
};

const SDXL =
  "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

/** ספק ראשי: Replicate SDXL (דורש קרדיט) */
async function viaReplicate({ prompt, width, height }) {
  const output = await replicate.run(SDXL, {
    input: {
      prompt,
      negative_prompt: NEGATIVE,
      width,
      height,
      num_inference_steps: 40,
      guidance_scale: 7.5,
    },
  });
  const first = Array.isArray(output) ? output[0] : output;
  return typeof first === "string" ? first : (await first.url()).toString();
}

/** ספק גיבוי חינמי: Pollinations (FLUX) — ללא מפתח */
function viaPollinations({ prompt, width, height }) {
  const encoded = encodeURIComponent(`${prompt}. ${"avoid: " + NEGATIVE}`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=flux&seed=7`;
}

async function generate(key, asset) {
  console.log(`\n=== ${key} ===`);

  let sourceUrl;
  try {
    console.log("generating with Replicate SDXL...");
    sourceUrl = await viaReplicate(asset);
  } catch (err) {
    console.log(`replicate unavailable (${err.message?.slice(0, 80)})`);
    console.log("falling back to Pollinations (FLUX, free)...");
    sourceUrl = viaPollinations(asset);
  }
  console.log("source url:", sourceUrl.slice(0, 120));

  // הורדה מקומית (לבדיקה ויזואלית) + העלאה ל-Cloudinary
  const imgResp = await fetch(sourceUrl);
  if (!imgResp.ok) throw new Error(`download failed: ${imgResp.status}`);
  const buffer = Buffer.from(await imgResp.arrayBuffer());

  mkdirSync("generated-assets", { recursive: true });
  writeFileSync(`generated-assets/${key}.png`, buffer);

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "image/png" }), `${key}.png`);
  form.append("upload_preset", UPLOAD_PRESET);
  form.append("folder", "yerushalmi-site");

  const upResp = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );
  const upJson = await upResp.json();
  if (!upResp.ok) {
    throw new Error(`cloudinary upload failed: ${JSON.stringify(upJson)}`);
  }
  const cloudUrl = upJson.secure_url;
  console.log("cloudinary url:", cloudUrl);

  // שמירה ב-site_settings
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${key}, ${cloudUrl}, now())
    ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()
  `;
  console.log("saved to site_settings ✓");

  return cloudUrl;
}

const requested = process.argv.slice(2);
const keys = requested.length > 0 ? requested : Object.keys(ASSETS);

for (const key of keys) {
  if (!ASSETS[key]) {
    console.error(`unknown asset key: ${key}`);
    continue;
  }
  try {
    await generate(key, ASSETS[key]);
  } catch (err) {
    console.error(`FAILED ${key}:`, err.message);
  }
}

console.log("\nDone.");
