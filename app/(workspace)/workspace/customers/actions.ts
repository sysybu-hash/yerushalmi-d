"use server";

import { desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export type ImportCustomerRow = {
  full_name: string;
  email: string;
  phone: string;
};

/** שליפת לקוחות עם חיפוש אופציונלי (שם / אימייל / טלפון) */
export async function getCustomers(query?: string) {
  await requireAdmin();

  const q = query?.trim();
  if (q) {
    const pattern = `%${q}%`;
    return db
      .select()
      .from(customers)
      .where(
        or(
          ilike(customers.fullName, pattern),
          ilike(customers.email, pattern),
          ilike(customers.phone, pattern)
        )
      )
      .orderBy(desc(customers.createdAt));
  }

  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

/** יצירת לקוח חדש */
export async function createCustomer(formData: FormData) {
  await requireAdmin();

  const fullName = formData.get("full_name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase() || null;
  const phone = formData.get("phone")?.toString().trim() || null;

  if (!fullName) {
    throw new Error("שם מלא הוא שדה חובה");
  }

  await db.insert(customers).values({ fullName, email, phone });

  revalidatePath("/workspace/customers");
}

/** עדכון לקוח קיים */
export async function updateCustomer(id: number, formData: FormData) {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("מזהה לקוח לא תקין");
  }

  const fullName = formData.get("full_name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase() || null;
  const phone = formData.get("phone")?.toString().trim() || null;

  if (!fullName) {
    throw new Error("שם מלא הוא שדה חובה");
  }

  const [updated] = await db
    .update(customers)
    .set({ fullName, email, phone })
    .where(eq(customers.id, id))
    .returning({ id: customers.id });

  if (!updated) {
    throw new Error("הלקוח לא נמצא");
  }

  revalidatePath("/workspace/customers");
}

/** מחיקת לקוח */
export async function deleteCustomer(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("מזהה לקוח לא תקין");
  }

  await db.delete(customers).where(eq(customers.id, id));

  revalidatePath("/workspace/customers");
}

/**
 * ייבוא לקוחות בכמות גדולה (מקובץ CSV).
 * כפילויות לפי אימייל מדולגות בשקט (onConflictDoNothing),
 * ושורות ללא שם נפסלות.
 */
export async function importCustomers(customersList: ImportCustomerRow[]) {
  await requireAdmin();
  if (!Array.isArray(customersList) || customersList.length === 0) {
    throw new Error("לא נמצאו לקוחות לייבוא");
  }

  if (customersList.length > 5000) {
    throw new Error("ניתן לייבא עד 5,000 לקוחות בבת אחת");
  }

  const validRows = customersList
    .map((row) => ({
      fullName: row.full_name?.toString().trim() ?? "",
      email: row.email?.toString().trim().toLowerCase() || null,
      phone: row.phone?.toString().trim() || null,
    }))
    .filter((row) => row.fullName.length > 0);

  if (validRows.length === 0) {
    throw new Error("כל השורות בקובץ חסרות שם מלא — לא יובא דבר");
  }

  const inserted = await db
    .insert(customers)
    .values(validRows)
    .onConflictDoNothing({ target: customers.email })
    .returning({ id: customers.id });

  revalidatePath("/workspace/customers");

  return {
    imported: inserted.length,
    skipped: customersList.length - inserted.length,
  };
}
