"use server";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { parseOptionalProductImageUrl } from "@/lib/product-images";

const PRODUCT_TYPES = ["natural", "lab"] as const;
type ProductType = (typeof PRODUCT_TYPES)[number];

export type ProductFilters = {
  q?: string;
  category?: string;
  sort?: string;
};

function parseProductForm(formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priceRaw = formData.get("price")?.toString().trim();
  const originalPriceRaw = formData.get("original_price")?.toString().trim();
  const type = formData.get("type")?.toString() as ProductType;
  const category = formData.get("category")?.toString().trim();
  const imageUrl = parseOptionalProductImageUrl(
    formData.get("image_url"),
    "תמונה ראשית"
  );
  const secondaryImageUrl = parseOptionalProductImageUrl(
    formData.get("secondary_image_url"),
    "תמונה שנייה"
  );

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

  await db.delete(products).where(eq(products.id, id));

  revalidatePath("/workspace/products");
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
  });

  revalidatePath("/workspace/products");
  revalidatePath("/", "layout");
}
