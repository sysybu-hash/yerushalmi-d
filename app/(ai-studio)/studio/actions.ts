"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { aiMediaAssets, products, siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { runStudioAction, type StudioActionResult } from "@/lib/studio-action";
import { IMAGE_SETTING_KEYS } from "@/lib/studio-presets";
import {
  pipelineCompositeImage,
  pipelineGenerateVideo,
  pipelineRemoveBackground,
} from "@/lib/studio-pipeline";
import { uploadBufferToCloudinary } from "@/lib/studio-replicate";
import type { StudioVideoProvider } from "@/lib/ai-studio-media";
import type { GenerateImageOptions, GenerateVideoOptions } from "@/lib/studio-types";
import type { SettingKey } from "@/lib/site-settings";

export type { GenerateImageOptions, GenerateVideoOptions } from "@/lib/studio-types";

export type PublishProductToCatalogInput = {
  title: string;
  description?: string;
  price: number;
  originalPrice?: number | null;
  type: "natural" | "lab";
  category: string;
  imageUrl: string;
};

function assertRemoteAssetUrl(url: string) {
  const allowed =
    url.startsWith("https://res.cloudinary.com/") ||
    url.startsWith("https://replicate.delivery/") ||
    /^https:\/\/[\w-]+\.replicate\.delivery\//.test(url);

  if (!allowed) {
    throw new Error("כתובת הנכס אינה תקינה");
  }
}

/** שלב 1: הסרת רקע */
export async function studioRemoveBackground(
  imageUrl: string
): Promise<StudioActionResult<{ url: string }>> {
  return runStudioAction(async () => {
    await requireAdmin();
    return pipelineRemoveBackground(imageUrl);
  }, "הסרת הרקע נכשלה — ודאו ש-REPLICATE_API_TOKEN מוגדר ב-Vercel.");
}

/** שלב 3: הרכבה */
export async function studioCompositeImage(
  cutoutUrl: string,
  options: GenerateImageOptions = {}
): Promise<StudioActionResult<{ url: string }>> {
  return runStudioAction(async () => {
    await requireAdmin();
    return pipelineCompositeImage(cutoutUrl, options);
  }, "הרכבת התמונה נכשלה — נסו צילום עם רקע אחיד.");
}

export async function generateLuxuryProductImage(
  imageUrl: string,
  options: GenerateImageOptions = {}
) {
  const cutout = await studioRemoveBackground(imageUrl);
  if (!cutout.ok) throw new Error(cutout.error);

  const composite = await studioCompositeImage(cutout.data.url, options);
  if (!composite.ok) throw new Error(composite.error);

  return { url: composite.data.url, cutoutUrl: cutout.data.url };
}

export async function generateLuxuryImage(
  imageUrl: string,
  options: GenerateImageOptions = {}
) {
  return generateLuxuryProductImage(imageUrl, options);
}

export async function generateJewelryVideo(
  imageUrl: string,
  options: GenerateVideoOptions = {}
): Promise<StudioActionResult<{ url: string; provider: StudioVideoProvider }>> {
  return runStudioAction(async () => {
    await requireAdmin();
    return pipelineGenerateVideo(imageUrl, options);
  }, "יצירת הווידאו נכשלה — ודאו ש-REPLICATE_API_TOKEN מוגדר ב-Vercel.");
}

export async function saveToMediaLibrary(
  mediaType: "image" | "video",
  originalUrl: string,
  generatedUrl: string
) {
  await requireAdmin();

  if (mediaType !== "image" && mediaType !== "video") {
    throw new Error("סוג מדיה לא תקין");
  }

  if (!originalUrl.trim() || !generatedUrl.trim()) {
    throw new Error("חסרות כתובות מדיה");
  }

  assertRemoteAssetUrl(originalUrl);
  assertRemoteAssetUrl(generatedUrl);

  const [created] = await db
    .insert(aiMediaAssets)
    .values({
      mediaType,
      originalUrl,
      generatedUrl,
      status: "draft",
    })
    .returning({ id: aiMediaAssets.id });

  revalidatePath("/workspace/content-library");

  return { id: created.id };
}

export async function saveAssetToCloudinary(
  sourceUrl: string,
  kind: "image" | "video"
) {
  await requireAdmin();

  if (sourceUrl.includes("res.cloudinary.com/")) {
    return { url: sourceUrl };
  }

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

/** מילוי שם/תיאור/קטגוריה אוטומטי ב-AI מתוך תמונת התוצאה */
export async function generateStudioListing(
  imageUrl: string
): Promise<StudioActionResult<import("@/lib/listing-ai").GeneratedListingContent>> {
  const { generateListingContent } = await import("@/lib/listing-ai");
  return runStudioAction(async () => {
    await requireAdmin();
    if (!imageUrl.startsWith("https://res.cloudinary.com/")) {
      throw new Error("נדרשת תמונה שמורה ב-Cloudinary");
    }
    return generateListingContent({
      imageUrls: [imageUrl],
      mode: "fill",
    });
  }, "מילוי הפרטים ב-AI נכשל — נסו שוב");
}

/**
 * מוודא שמוזיקת הרקע שנבחרה קיימת ב-Cloudinary (מעלה מ-Mixkit בפעם
 * הראשונה בלבד). נדרש לפני בניית URL עם l_audio — אחרת הטרנספורמציה
 * מפנה למשאב שלא קיים ומחזירה שגיאה (400).
 */
export async function ensureStudioAudioTrack(
  styleId: import("@/lib/studio-audio-presets").VideoAudioStyleId
): Promise<StudioActionResult<{ publicId: string | null }>> {
  const { ensureStudioAudioOnCloudinary } = await import(
    "@/lib/studio-audio-cloudinary"
  );
  return runStudioAction(async () => {
    await requireAdmin();
    const publicId = await ensureStudioAudioOnCloudinary(styleId);
    return { publicId };
  }, "העלאת מוזיקת הרקע נכשלה — נסו סגנון אחר");
}
