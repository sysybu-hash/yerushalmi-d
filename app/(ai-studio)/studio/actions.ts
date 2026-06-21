"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { products, siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { generatePresetBackground } from "@/lib/studio-backgrounds";
import { compositeProductImage } from "@/lib/studio-composite";
import {
  extractUrl,
  MODELS,
  normalizeStudioError,
  replicate,
  translateToEnglish,
  uploadBufferToCloudinary,
} from "@/lib/studio-replicate";
import {
  DEFAULT_VIDEO_NEGATIVE_PROMPT,
  DEFAULT_VIDEO_PROMPT,
  IMAGE_SETTING_KEYS,
  STUDIO_CANVAS_SIZE,
  STUDIO_PRESET_LIGHTING_HINTS,
  type StudioStylePresetId,
} from "@/lib/studio-presets";
import type { SettingKey } from "@/lib/site-settings";

export type GenerateImageOptions = {
  customPrompt?: string;
  stylePreset?: StudioStylePresetId;
};

export type GenerateVideoOptions = {
  customPrompt?: string;
  negativePrompt?: string;
  duration?: 5 | 10;
  mode?: "standard" | "pro";
};

export type PublishProductToCatalogInput = {
  title: string;
  description?: string;
  price: number;
  originalPrice?: number | null;
  type: "natural" | "lab";
  category: string;
  imageUrl: string;
};

function assertCloudinaryUrl(imageUrl: string) {
  if (!imageUrl.startsWith("https://res.cloudinary.com/")) {
    throw new Error("יש להעלות תמונת מקור דרך Cloudinary");
  }
}

function assertRemoteAssetUrl(url: string) {
  const allowed =
    url.startsWith("https://res.cloudinary.com/") ||
    url.startsWith("https://replicate.delivery/") ||
    /^https:\/\/[\w-]+\.replicate\.delivery\//.test(url);

  if (!allowed) {
    throw new Error("כתובת הנכס אינה תקינה");
  }
}

async function buildLightingHints(
  customPrompt?: string,
  stylePreset: StudioStylePresetId = "luxury-marble"
) {
  const presetHints = STUDIO_PRESET_LIGHTING_HINTS[stylePreset];
  const trimmed = customPrompt?.trim();
  if (!trimmed) return presetHints;
  const translated = await translateToEnglish(trimmed);
  return translated ? `${presetHints}, ${translated}` : presetHints;
}

/** שלב 1: הסרת רקע — שומר את התכשיט המקורי בדיוק */
export async function studioRemoveBackground(imageUrl: string) {
  await requireAdmin();
  assertCloudinaryUrl(imageUrl);

  try {
    // Replicate cjwbw/rembg accepts only `image` — extra fields cause API errors.
    const output = await replicate.run(MODELS.rembg, {
      input: { image: imageUrl },
    });

    return { url: extractUrl(output) };
  } catch (error) {
    throw new Error(
      normalizeStudioError(
        error,
        "הסרת הרקע נכשלה — ודאו ש-REPLICATE_API_TOKEN מוגדר ונסו שוב."
      )
    );
  }
}

/** שלב 2: רקע יוקרתי (Sharp — לא AI, בלי תכשיטים מומצאים) */
export async function studioGenerateBackground(
  options: GenerateImageOptions = {}
) {
  await requireAdmin();

  const preset = options.stylePreset ?? "luxury-marble";
  const lightingHints = await buildLightingHints(options.customPrompt, preset);
  const buffer = await generatePresetBackground({
    preset,
    lightingHints,
    size: STUDIO_CANVAS_SIZE,
  });

  const url = await uploadBufferToCloudinary(
    buffer,
    `studio-bg-${Date.now()}.png`,
    "image"
  );

  return { url, lightingHints };
}

/** שלב 3: הרכבה — התכשיט מה-cutout, הרקע מה-preset */
export async function studioCompositeImage(
  cutoutUrl: string,
  options: GenerateImageOptions = {}
) {
  await requireAdmin();
  assertRemoteAssetUrl(cutoutUrl);

  const preset = options.stylePreset ?? "luxury-marble";
  const lightingHints = await buildLightingHints(options.customPrompt, preset);
  const backgroundBuffer = await generatePresetBackground({
    preset,
    lightingHints,
    size: STUDIO_CANVAS_SIZE,
  });

  try {
    const buffer = await compositeProductImage(
      cutoutUrl,
      backgroundBuffer,
      STUDIO_CANVAS_SIZE
    );
    const url = await uploadBufferToCloudinary(
      buffer,
      `studio-composite-${Date.now()}.png`,
      "image"
    );

    return { url };
  } catch (error) {
    throw new Error(
      normalizeStudioError(error, "הרכבת התמונה נכשלה — נסו צילום עם רקע אחיד.")
    );
  }
}

/**
 * Pipeline מלא: rembg → רקע preset → composite.
 * התכשיט לא עובר img2img — אי אפשר "להמציא" טבעת אחרת.
 */
export async function generateLuxuryProductImage(
  imageUrl: string,
  options: GenerateImageOptions = {}
) {
  await requireAdmin();
  assertCloudinaryUrl(imageUrl);

  const { url: cutoutUrl } = await studioRemoveBackground(imageUrl);
  const { url } = await studioCompositeImage(cutoutUrl, options);

  return { url, cutoutUrl };
}

/** @deprecated img2img ממציא תכשיטים — נשמר לתאימות, לא בשימוש ב-UI */
export async function generateLuxuryImage(
  imageUrl: string,
  options: GenerateImageOptions = {}
) {
  return generateLuxuryProductImage(imageUrl, options);
}

async function generateKlingVideo(
  imageUrl: string,
  options: GenerateVideoOptions
) {
  const englishCustom = options.customPrompt?.trim()
    ? await translateToEnglish(options.customPrompt)
    : "";

  const prompt = englishCustom
    ? `${DEFAULT_VIDEO_PROMPT}, ${englishCustom}`
    : DEFAULT_VIDEO_PROMPT;

  const output = await replicate.run(MODELS.kling, {
    input: {
      start_image: imageUrl,
      prompt,
      negative_prompt:
        options.negativePrompt?.trim() || DEFAULT_VIDEO_NEGATIVE_PROMPT,
      duration: options.duration ?? 5,
      mode: options.mode ?? "pro",
    },
  });

  return extractUrl(output);
}


export async function generateJewelryVideo(
  imageUrl: string,
  options: GenerateVideoOptions = {}
) {
  await requireAdmin();
  assertCloudinaryUrl(imageUrl);

  try {
    const url = await generateKlingVideo(imageUrl, options);
    return { url, provider: "kling" as const };
  } catch (klingError) {
    console.error("Kling video failed:", klingError);
    throw new Error(
      klingError instanceof Error
        ? klingError.message
        : "יצירת הווידאו נכשלה. ודאו שיצרתם תמונת יוקרה תחילה ונסו שוב במצב Pro (1080p)."
    );
  }
}

export async function saveAssetToCloudinary(
  sourceUrl: string,
  kind: "image" | "video"
) {
  await requireAdmin();
  assertRemoteAssetUrl(sourceUrl);

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error("לא ניתן להוריד את הקובץ מהשרת");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = kind === "video" ? "mp4" : "png";
  const url = await uploadBufferToCloudinary(
    buffer,
    `studio-${Date.now()}.${ext}`,
    kind
  );

  return { url };
}

export async function publishImageToSite(
  settingKey: SettingKey,
  imageUrl: string
) {
  await requireAdmin();

  if (!IMAGE_SETTING_KEYS.has(settingKey)) {
    throw new Error("יעד פרסום לא תקין");
  }

  if (!imageUrl.startsWith("https://res.cloudinary.com/")) {
    throw new Error("יש לפרסם רק תמונות שנשמרו ב-Cloudinary");
  }

  await db
    .insert(siteSettings)
    .values({ key: settingKey, value: imageUrl })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: sql`excluded.value`,
        updatedAt: sql`now()`,
      },
    });

  revalidatePath("/", "layout");
  revalidatePath("/workspace/settings");

  return { settingKey };
}

const PRODUCT_TYPES = ["natural", "lab"] as const;
const PRODUCT_CATEGORIES = [
  "rings",
  "engagement-rings",
  "necklaces",
  "earrings",
  "bracelets",
  "diamonds",
  "custom",
] as const;

/** הוספת מוצר למלאי ישירות מהסטודיו */
export async function publishProductToCatalog(
  input: PublishProductToCatalogInput
) {
  await requireAdmin();

  const title = input.title.trim();
  if (!title) {
    throw new Error("שם המוצר הוא שדה חובה");
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error("יש להזין מחיר תקין");
  }

  if (
    input.originalPrice != null &&
    (!Number.isFinite(input.originalPrice) || input.originalPrice < 0)
  ) {
    throw new Error("מחיר לפני הנחה אינו תקין");
  }

  if (!PRODUCT_TYPES.includes(input.type)) {
    throw new Error("יש לבחור סוג יהלום");
  }

  if (
    !PRODUCT_CATEGORIES.includes(
      input.category as (typeof PRODUCT_CATEGORIES)[number]
    )
  ) {
    throw new Error("יש לבחור קטגוריה");
  }

  if (!input.imageUrl.startsWith("https://res.cloudinary.com/")) {
    throw new Error("יש לפרסם רק תמונות שנשמרו ב-Cloudinary");
  }

  const [created] = await db
    .insert(products)
    .values({
      title,
      description: input.description?.trim() || null,
      price: input.price.toFixed(2),
      originalPrice:
        input.originalPrice != null
          ? input.originalPrice.toFixed(2)
          : null,
      type: input.type,
      category: input.category,
      imageUrl: input.imageUrl,
    })
    .returning({ id: products.id });

  revalidatePath("/workspace/products");
  revalidatePath("/", "layout");

  return { productId: created.id };
}
