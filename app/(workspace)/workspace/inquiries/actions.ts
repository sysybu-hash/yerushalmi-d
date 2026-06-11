"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { contactInquiries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

/** שליפת כל הפניות, מהחדש לישן */
export async function getInquiries() {
  await requireAdmin();
  return db
    .select()
    .from(contactInquiries)
    .orderBy(desc(contactInquiries.createdAt));
}

/** סימון פנייה כטופלה */
export async function resolveInquiry(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("מזהה פנייה לא תקין");
  }

  const [updated] = await db
    .update(contactInquiries)
    .set({ status: "resolved" })
    .where(eq(contactInquiries.id, id))
    .returning({ id: contactInquiries.id });

  if (!updated) {
    throw new Error("הפנייה לא נמצאה");
  }

  revalidatePath("/workspace/inquiries");
}
