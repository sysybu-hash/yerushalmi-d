/**
 * 12 מוצרי דמו — 2 תמונות לכל מוצר.
 * מנסה Replicate SDXL; אם נכשל — מעלה את hero-background.jpg מקומית.
 *
 * הרצה: npm run db:seed-demo
 */

import dotenv from "dotenv";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import Replicate from "replicate";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const replicate = process.env.REPLICATE_API_TOKEN
  ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  : null;

const DEMO_MARKER = "[seed:demo-v1]";
const NEGATIVE =
  "people, person, hands, fingers, face, skin, text, watermark, logo, blurry, low quality, cartoon";
const SDXL =
  "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

const LOCAL_FALLBACK = join(process.cwd(), "public", "images", "hero-background.jpg");

const DEMO_PRODUCTS = [
  {
    title: "טבעת אירוסין סוליטר 1.2 קראט",
    category: "engagement-rings",
    type: "natural",
    price: "18900.00",
    originalPrice: "21900.00",
    description: `טבעת אירוסין קלאסית בזהב לבן 18K, יהלום סוליטר 1.2 קראט.\n${DEMO_MARKER}`,
    prompts: [
      "luxury solitaire diamond engagement ring white gold on black velvet, studio product photo, no people",
      "close up diamond engagement ring sparkling facets dark background product photography, no people",
    ],
  },
  {
    title: "טבעת אירוסין Halo יהלום טיפה",
    category: "engagement-rings",
    type: "lab",
    price: "14500.00",
    originalPrice: null,
    description: `יהלום טיפה במרכז, היקף Halo מנצנץ.\n${DEMO_MARKER}`,
    prompts: [
      "pear cut diamond halo engagement ring on dark marble product photo, no people",
      "elegant teardrop diamond ring macro gold band jewelry photography, no people",
    ],
  },
  {
    title: "טבעת טנסי יהלומים 3 קראט",
    category: "rings",
    type: "natural",
    price: "32000.00",
    originalPrice: "35000.00",
    description: `שורת יהלומים מלוטשים, זהב לבן.\n${DEMO_MARKER}`,
    prompts: [
      "diamond eternity band ring white gold dark background product photo, no people",
      "row of diamonds gold ring close up jewelry photography, no people",
    ],
  },
  {
    title: "טבעת זהב צהוב משובצת",
    category: "rings",
    type: "natural",
    price: "8900.00",
    originalPrice: null,
    description: `טבעת יומיומית יוקרתית בזהב צהוב 14K.\n${DEMO_MARKER}`,
    prompts: [
      "yellow gold diamond ring on black leather luxury product photo, no people",
      "stackable gold ring small diamonds studio lighting, no people",
    ],
  },
  {
    title: "צמיד Tennis יהלומים",
    category: "bracelets",
    type: "natural",
    price: "42000.00",
    originalPrice: "48000.00",
    description: `צמיד Tennis קלאסי.\n${DEMO_MARKER}`,
    prompts: [
      "diamond tennis bracelet on black silk fabric product photo, no people",
      "sparkling diamond line bracelet white gold close up, no people",
    ],
  },
  {
    title: "צמיד זהב ויהלומים עדין",
    category: "bracelets",
    type: "lab",
    price: "12500.00",
    originalPrice: null,
    description: `צמיד גמיש עם נקודות אור.\n${DEMO_MARKER}`,
    prompts: [
      "delicate gold diamond bracelet dark velvet jewelry photo, no people",
      "thin gold bangle diamond accents product shot, no people",
    ],
  },
  {
    title: "תליון סוליטר על שרשרת",
    category: "necklaces",
    type: "natural",
    price: "15800.00",
    originalPrice: "17500.00",
    description: `יהלום סוליטר 0.8 קראט על שרשרת זהב.\n${DEMO_MARKER}`,
    prompts: [
      "solitaire diamond pendant necklace on jewelry display bust no face product photo",
      "diamond pendant gold chain flat lay dark background, no people",
    ],
  },
  {
    title: "שרשרת יהלומים עדינה",
    category: "necklaces",
    type: "lab",
    price: "9800.00",
    originalPrice: null,
    description: `שרשרת עם יהלומים קטנים לאורך.\n${DEMO_MARKER}`,
    prompts: [
      "delicate diamond station necklace white gold dark background, no people",
      "minimal diamond necklace luxury product photography, no people",
    ],
  },
  {
    title: "עגילי סוליטר יהלום",
    category: "earrings",
    type: "natural",
    price: "11200.00",
    originalPrice: null,
    description: `זוג עגילי studs, 0.5 קראט כל אחד.\n${DEMO_MARKER}`,
    prompts: [
      "pair of diamond stud earrings on black surface product photo, no people",
      "solitaire diamond earrings white gold sparkling macro, no people",
    ],
  },
  {
    title: "עגילי תלייה יהלום",
    category: "earrings",
    type: "lab",
    price: "7600.00",
    originalPrice: "8900.00",
    description: `עגילי drop אלגנטיים.\n${DEMO_MARKER}`,
    prompts: [
      "diamond drop earrings on dark velvet jewelry photo, no people",
      "elegant dangling diamond earrings gold studio lighting, no people",
    ],
  },
  {
    title: "יהלום גולמי 2.01 קראט",
    category: "diamonds",
    type: "natural",
    price: "85000.00",
    originalPrice: null,
    description: `יהלום גולמי עם תעודה גמולוגית.\n${DEMO_MARKER}`,
    prompts: [
      "rough uncut diamond crystal black background gemology photo, no people",
      "raw diamond stone macro dark moody lighting, no people",
    ],
  },
  {
    title: "יהלום מלוטש 1.5 קראט",
    category: "diamonds",
    type: "natural",
    price: "52000.00",
    originalPrice: "58000.00",
    description: `יהלום מלוטש Brilliant, Ideal Cut.\n${DEMO_MARKER}`,
    prompts: [
      "brilliant cut loose diamond on black mirror surface product photo, no people",
      "single polished diamond gemstone macro sparkling facets, no people",
    ],
  },
];

async function generateWithReplicate(prompt) {
  if (!replicate) throw new Error("no replicate token");
  const output = await replicate.run(SDXL, {
    input: {
      prompt,
      negative_prompt: NEGATIVE,
      width: 768,
      height: 768,
      num_inference_steps: 30,
      guidance_scale: 7.5,
    },
  });
  const first = Array.isArray(output) ? output[0] : output;
  const url = typeof first === "string" ? first : (await first.url()).toString();
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`replicate download ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

function localFallbackBuffer() {
  if (!existsSync(LOCAL_FALLBACK)) {
    throw new Error(`missing fallback image: ${LOCAL_FALLBACK}`);
  }
  return readFileSync(LOCAL_FALLBACK);
}

async function resolveImageBuffer(prompt, label) {
  try {
    console.log(`    generating: ${label}...`);
    return await generateWithReplicate(prompt);
  } catch (err) {
    console.log(`    fallback (${err.message?.slice(0, 60)}): ${label}`);
    return localFallbackBuffer();
  }
}

async function uploadBuffer(buffer, publicId, mime = "image/png") {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mime }), `${publicId}.png`);
  form.append("upload_preset", UPLOAD_PRESET);
  form.append("folder", "yerushalmi-products/demo");

  const upResp = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );
  const json = await upResp.json();
  if (!upResp.ok) throw new Error(`cloudinary: ${JSON.stringify(json)}`);
  return json.secure_url;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary env vars missing");
  }

  console.log("Removing previous demo products...");
  await sql`DELETE FROM products WHERE description LIKE ${`%${DEMO_MARKER}%`}`;

  console.log("Creating 12 demo products (2 images each)...\n");

  for (let i = 0; i < DEMO_PRODUCTS.length; i++) {
    const product = DEMO_PRODUCTS[i];
    const slug = `demo-${i + 1}`;

    console.log(`[${i + 1}/12] ${product.title}`);

    const [buf1, buf2] = await Promise.all([
      resolveImageBuffer(product.prompts[0], "primary"),
      resolveImageBuffer(product.prompts[1], "secondary"),
    ]);

    const [imageUrl, secondaryImageUrl] = await Promise.all([
      uploadBuffer(buf1, `${slug}-1`),
      uploadBuffer(buf2, `${slug}-2`),
    ]);

    await sql`
      INSERT INTO products (
        title, description, price, original_price, type, category,
        image_url, secondary_image_url
      ) VALUES (
        ${product.title},
        ${product.description},
        ${product.price},
        ${product.originalPrice},
        ${product.type}::product_type,
        ${product.category},
        ${imageUrl},
        ${secondaryImageUrl}
      )
    `;

    console.log("  ✓ inserted\n");
  }

  console.log("Done — 12 demo products ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
