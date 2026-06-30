"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { aiMediaAssets, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import type { ProductMediaItem } from "@/lib/product-media";
import { sortProductMedia } from "@/lib/product-media";

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

export type PublishListingInput = {
  assetIds: number[];
  title: string;
  description?: string;
  price: number;
  originalPrice?: number | null;
  type: "natural" | "lab";
  category: string;
};

/** שליפת כל נכסי המדיה מספריית התוכן, מהחדש לישן */
export async function getMediaAssets() {
  await requireAdmin();
  return db
    .select()
    .from(aiMediaAssets)
    .orderBy(desc(aiMediaAssets.createdAt));
}

/** עדכון כותרת/תווית לנכס בספרייה */
export async function updateMediaAsset(
  id: number,
  input: { title?: string | null }
) {
  await requireAdmin();

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("מזהה נכס לא תקין");
  }

  const title = input.title?.trim() || null;

  const [updated] = await db
    .update(aiMediaAssets)
    .set({ title })
    .where(eq(aiMediaAssets.id, id))
    .returning();

  if (!updated) {
    throw new Error("הנכס לא נמצא");
  }

  revalidatePath("/workspace/content-library");
  return updated;
}

/** מחיקת נכס מהספרייה (טיוטה או ארכיון) */
export async function deleteMediaAsset(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("מזהה נכס לא תקין");
  }

  const [asset] = await db
    .select()
    .from(aiMediaAssets)
    .where(eq(aiMediaAssets.id, id));

  if (!asset) {
    throw new Error("הנכס לא נמצא");
  }

  if (asset.status === "published") {
    throw new Error("לא ניתן למחוק נכס פורסם — העבירו לארכיון תחילה");
  }

  await db.delete(aiMediaAssets).where(eq(aiMediaAssets.id, id));

  revalidatePath("/workspace/content-library");
}

/** העברת נכס לארכיון */
export async function archiveMediaAsset(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("מזהה נכס לא תקין");
  }

  const [updated] = await db
    .update(aiMediaAssets)
    .set({ status: "archived", publishedProductId: null })
    .where(eq(aiMediaAssets.id, id))
    .returning({ id: aiMediaAssets.id });

  if (!updated) {
    throw new Error("הנכס לא נמצא");
  }

  revalidatePath("/workspace/content-library");

  return { id: updated.id };
}

/** שחזור נכס מארכיון לטיוטה */
export async function restoreAssetFromArchive(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("מזהה נכס לא תקין");
  }

  const [asset] = await db
    .select()
    .from(aiMediaAssets)
    .where(eq(aiMediaAssets.id, id));

  if (!asset) {
    throw new Error("הנכס לא נמצא");
  }

  if (asset.status !== "archived") {
    throw new Error("ניתן לשחזר רק נכסים בארכיון");
  }

  const [updated] = await db
    .update(aiMediaAssets)
    .set({ status: "draft", publishedProductId: null })
    .where(eq(aiMediaAssets.id, id))
    .returning({ id: aiMediaAssets.id });

  revalidatePath("/workspace/content-library");

  return { id: updated!.id };
}

/** מחזיר נכס פורסם לטיוטה לשימוש חוזר במודעה חדשה */
export async function restoreAssetToDraft(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("מזהה נכס לא תקין");
  }

  const [updated] = await db
    .update(aiMediaAssets)
    .set({ status: "draft", publishedProductId: null })
    .where(eq(aiMediaAssets.id, id))
    .returning({ id: aiMediaAssets.id });

  if (!updated) {
    throw new Error("הנכס לא נמצא");
  }

  revalidatePath("/workspace/content-library");

  return { id: updated.id };
}

/** סימון נכס בודד כפורסם (תאימות לאחור) */
export async function markAssetAsPublished(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("מזהה נכס לא תקין");
  }

  const [updated] = await db
    .update(aiMediaAssets)
    .set({ status: "published" })
    .where(eq(aiMediaAssets.id, id))
    .returning({ id: aiMediaAssets.id });

  if (!updated) {
    throw new Error("הנכס לא נמצא");
  }

  revalidatePath("/workspace/content-library");
  return { id: updated.id };
}

/** פרסום מודעה/מוצר מלא מנכסים נבחרים */
export async function publishListingFromAssets(input: PublishListingInput) {
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

  const uniqueIds = Array.from(new Set(input.assetIds));
  if (uniqueIds.length === 0) {
    throw new Error("יש לבחור לפחות נכס אחד");
  }

  const assets = await db
    .select()
    .from(aiMediaAssets)
    .where(inArray(aiMediaAssets.id, uniqueIds));

  if (assets.length !== uniqueIds.length) {
    throw new Error("חלק מהנכסים לא נמצאו");
  }

  const unpublished = assets.filter((asset) => asset.status !== "draft");
  if (unpublished.length > 0) {
    throw new Error("ניתן לפרסם רק נכסים בסטטוס טיוטה");
  }

  const images = assets.filter((asset) => asset.mediaType === "image");
  if (images.length === 0) {
    throw new Error("יש לבחור לפחות תמונה אחת למודעה");
  }

  const videos = assets.filter((asset) => asset.mediaType === "video");

  const mediaGallery: ProductMediaItem[] = sortProductMedia(
    assets.map((asset) => ({
      type: asset.mediaType as "image" | "video",
      url: asset.generatedUrl,
    }))
  );

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
      imageUrl: images[0].generatedUrl,
      secondaryImageUrl: images[1]?.generatedUrl ?? null,
      videoUrl: videos[0]?.generatedUrl ?? null,
      mediaGallery,
    })
    .returning({ id: products.id });

  await db
    .update(aiMediaAssets)
    .set({ status: "published", publishedProductId: created.id })
    .where(inArray(aiMediaAssets.id, uniqueIds));

  revalidatePath("/workspace/content-library");
  revalidatePath("/workspace/products");
  revalidatePath("/", "layout");

  return { productId: created.id };
}
