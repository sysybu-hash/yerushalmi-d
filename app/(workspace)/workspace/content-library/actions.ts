"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { aiMediaAssets } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

/** שליפת כל נכסי המדיה מספריית התוכן, מהחדש לישן */
export async function getMediaAssets() {
  await requireAdmin();
  return db
    .select()
    .from(aiMediaAssets)
    .orderBy(desc(aiMediaAssets.createdAt));
}

/** סימון נכס כפורסם לאחר מעבר לטופס הוספת מוצר */
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
