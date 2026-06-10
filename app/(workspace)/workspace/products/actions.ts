"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { products } from "@/db/schema";

const PRODUCT_TYPES = ["natural", "lab"] as const;
type ProductType = (typeof PRODUCT_TYPES)[number];

/** שליפת כל המוצרים, מהחדש לישן */
export async function getProducts() {
  return db.select().from(products).orderBy(desc(products.createdAt));
}

/** הוספת מוצר חדש מתוך טופס */
export async function addProduct(formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priceRaw = formData.get("price")?.toString().trim();
  const type = formData.get("type")?.toString() as ProductType;
  const category = formData.get("category")?.toString().trim();

  if (!title) {
    throw new Error("שם המוצר הוא שדה חובה");
  }

  const price = Number(priceRaw);
  if (!priceRaw || Number.isNaN(price) || price < 0) {
    throw new Error("יש להזין מחיר תקין");
  }

  if (!PRODUCT_TYPES.includes(type)) {
    throw new Error("יש לבחור סוג יהלום");
  }

  if (!category) {
    throw new Error("יש לבחור קטגוריה");
  }

  await db.insert(products).values({
    title,
    description,
    price: price.toFixed(2),
    type,
    category,
  });

  revalidatePath("/workspace/products");
}

/** מחיקת מוצר לפי מזהה */
export async function deleteProduct(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("מזהה מוצר לא תקין");
  }

  await db.delete(products).where(eq(products.id, id));

  revalidatePath("/workspace/products");
}
