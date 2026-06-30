"use server";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  generateListingContent as generateListingContentAi,
  type GeneratedListingContent,
} from "@/lib/listing-ai";
import { isAllowedProductMediaUrl } from "@/lib/product-images";
import { parseOptionalProductImageUrl } from "@/lib/product-images";
import {
  deriveProductMediaFields,
  resolveProductMedia,
  sortProductMedia,
  type ProductMediaItem,
} from "@/lib/product-media";
import { releaseAssetsForProduct } from "@/lib/release-product-assets";
import { runStudioAction } from "@/lib/studio-action";

const PRODUCT_TYPES = ["natural", "lab"] as const;
type ProductType = (typeof PRODUCT_TYPES)[number];

export type ProductFilters = {
  q?: string;
  category?: string;
  sort?: string;
};

function parseMediaGallery(raw: FormDataEntryValue | null): ProductMediaItem[] {
  const value = raw?.toString().trim();
  if (!value) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("גלריית המדיה אינה תקינה");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("גלריית המדיה אינה תקינה");
  }

  const items: ProductMediaItem[] = [];
  for (const entry of parsed) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !("type" in entry) ||
      !("url" in entry)
    ) {
      throw new Error("פריט מדיה אינו תקין");
    }
    const type = String((entry as { type: unknown }).type);
    const url = String((entry as { url: unknown }).url).trim();
    if (type !== "image" && type !== "video") {
      throw new Error("סוג מדיה לא נתמך");
    }
    if (!url || !isAllowedProductMediaUrl(url)) {
      throw new Error("כתובת מדיה אינה תקינה");
    }
    items.push({ type, url });
  }

  return sortProductMedia(items);
}

function parseProductForm(formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priceRaw = formData.get("price")?.toString().trim();
  const originalPriceRaw = formData.get("original_price")?.toString().trim();
  const type = formData.get("type")?.toString() as ProductType;
  const category = formData.get("category")?.toString().trim();
  const gallery = parseMediaGallery(formData.get("media_gallery"));
  const mediaFields = deriveProductMediaFields(gallery);

  // תאימות לאחור — אם אין גלריה, קוראים שדות ישנים
  const imageUrl =
    gallery.length > 0
      ? mediaFields.imageUrl
      : parseOptionalProductImageUrl(formData.get("image_url"), "תמונה ראשית");
  const secondaryImageUrl =
    gallery.length > 0
      ? mediaFields.secondaryImageUrl
      : parseOptionalProductImageUrl(
          formData.get("secondary_image_url"),
          "תמונה שנייה"
        );
  const videoUrl = gallery.length > 0 ? mediaFields.videoUrl : null;
  const mediaGallery = gallery.length > 0 ? mediaFields.mediaGallery : null;

  if (!title) {
    throw new Error("שם המוצר הוא שדה חובה");
  }

  const price = Number(priceRaw);
  if (!priceRaw || Number.isNaN(price) || price < 0) {
    throw new Error("יש להזין מחיר תקין");
  }

  let originalPrice: number | null = null;
  if (originalPriceRaw) {
    originalPrice = Number(originalPriceRaw);
    if (Number.isNaN(originalPrice) || originalPrice < 0) {
      throw new Error("מחיר לפני הנחה אינו תקין");
    }
  }

  if (!PRODUCT_TYPES.includes(type)) {
    throw new Error("יש לבחור סוג יהלום");
  }

  if (!category) {
    throw new Error("יש לבחור קטגוריה");
  }

  return {
    title,
    description,
    price: price.toFixed(2),
    originalPrice:
      originalPrice !== null ? originalPrice.toFixed(2) : null,
    type,
    category,
    imageUrl,
    secondaryImageUrl,
    videoUrl,
    mediaGallery,
  };
}

/** שליפת מוצרים עם סינון, חיפוש ומיון */
export async function getProducts(filters?: ProductFilters) {
  await requireAdmin();

  const conditions = [];

  const q = filters?.q?.trim();
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(products.title, pattern),
        ilike(products.description, pattern)
      )
    );
  }

  const category = filters?.category?.trim();
  if (category) {
    conditions.push(eq(products.category, category));
  }

  const baseQuery = db.select().from(products);
  const filteredQuery =
    conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery;

  const sort = filters?.sort ?? "newest";
  switch (sort) {
    case "oldest":
      return filteredQuery.orderBy(asc(products.createdAt));
    case "price_asc":
      return filteredQuery.orderBy(asc(products.price));
    case "price_desc":
      return filteredQuery.orderBy(desc(products.price));
    default:
      return filteredQuery.orderBy(desc(products.createdAt));
  }
}

/** הוספת מוצר חדש מתוך טופס */
export async function addProduct(formData: FormData) {
  await requireAdmin();
  const data = parseProductForm(formData);

  await db.insert(products).values(data);

  revalidatePath("/workspace/products");
  revalidatePath("/", "layout");
}

/** עדכון מוצר קיים */
export async function updateProduct(id: number, formData: FormData) {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("מזהה מוצר לא תקין");
  }

  const data = parseProductForm(formData);

  await db.update(products).set(data).where(eq(products.id, id));

  revalidatePath("/workspace/products");
  revalidatePath("/", "layout");
  revalidatePath(`/products/${id}`);
}

/** מחיקת מוצר לפי מזהה */
export async function deleteProduct(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("מזהה מוצר לא תקין");
  }

  await releaseAssetsForProduct(id);
  await db.delete(products).where(eq(products.id, id));

  revalidatePath("/workspace/products");
  revalidatePath("/workspace/content-library");
  revalidatePath("/", "layout");
}

/** שכפול מוצר קיים */
export async function duplicateProduct(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("מזהה מוצר לא תקין");
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (!product) {
    throw new Error("המוצר לא נמצא");
  }

  await db.insert(products).values({
    title: `${product.title} (עותק)`,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    type: product.type,
    category: product.category,
    imageUrl: product.imageUrl,
    secondaryImageUrl: product.secondaryImageUrl,
    videoUrl: product.videoUrl,
    mediaGallery: product.mediaGallery,
  });

  revalidatePath("/workspace/products");
  revalidatePath("/", "layout");
}

export type GenerateProductListingInput = {
  productId: number;
  mode: "fill" | "refine";
  existingTitle?: string;
  existingDescription?: string;
};

/** מילוי או שיפור תוכן מודעה קיימת באמצעות AI */
export async function generateProductListingContent(
  input: GenerateProductListingInput
) {
  return runStudioAction(async (): Promise<GeneratedListingContent> => {
    await requireAdmin();

    if (!Number.isInteger(input.productId) || input.productId < 1) {
      throw new Error("מזהה מוצר לא תקין");
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.productId));

    if (!product) {
      throw new Error("המוצר לא נמצא");
    }

    const imageUrls = resolveProductMedia(product)
      .filter((item) => item.type === "image")
      .map((item) => item.url);

    if (input.mode === "fill" && imageUrls.length === 0) {
      throw new Error("נדרשת לפחות תמונת מוצר אחת למילוי אוטומטי");
    }

    return generateListingContentAi({
      imageUrls,
      assetTitles: [product.title],
      existingTitle: input.existingTitle ?? product.title,
      existingDescription:
        input.existingDescription ?? product.description ?? undefined,
      mode: input.mode,
    });
  }, "יצירת התוכן ב-AI נכשלה — ודאו ש-REPLICATE_API_TOKEN מוגדר ב-Vercel.");
}
