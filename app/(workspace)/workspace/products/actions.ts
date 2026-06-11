"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const PRODUCT_TYPES = ["natural", "lab"] as const;
type ProductType = (typeof PRODUCT_TYPES)[number];

function parseProductForm(formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priceRaw = formData.get("price")?.toString().trim();
  const originalPriceRaw = formData.get("original_price")?.toString().trim();
  const type = formData.get("type")?.toString() as ProductType;
  const category = formData.get("category")?.toString().trim();
  const imageUrl = formData.get("image_url")?.toString().trim() || null;

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

  const ALLOWED_IMAGE_HOSTS = [
    "https://res.cloudinary.com/",
    "https://replicate.delivery/",
  ];
  if (
    imageUrl &&
    !ALLOWED_IMAGE_HOSTS.some((host) => imageUrl.startsWith(host)) &&
    !/^https:\/\/[\w-]+\.replicate\.delivery\//.test(imageUrl)
  ) {
    throw new Error("כתובת התמונה אינה תקינה");
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
  };
}

/** שליפת כל המוצרים, מהחדש לישן */
export async function getProducts() {
  await requireAdmin();
  return db.select().from(products).orderBy(desc(products.createdAt));
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

