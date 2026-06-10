"use server";

import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { customers } from "@/db/schema";

export type ImportCustomerRow = {
  full_name: string;
  email: string;
  phone: string;
};

/** שליפת כל הלקוחות, מהחדש לישן */
export async function getCustomers() {
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

/**
 * ייבוא לקוחות בכמות גדולה (מקובץ CSV).
 * כפילויות לפי אימייל מדולגות בשקט (onConflictDoNothing),
 * ושורות ללא שם נפסלות.
 */
export async function importCustomers(customersList: ImportCustomerRow[]) {
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
