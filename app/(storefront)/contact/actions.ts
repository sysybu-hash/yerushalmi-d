"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { contactInquiries } from "@/db/schema";

/** שליחת טופס יצירת קשר מהחנות */
export async function submitInquiry(formData: FormData) {
  const fullName = formData.get("full_name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const subject = formData.get("subject")?.toString().trim() || null;
  const message = formData.get("message")?.toString().trim();

  if (!fullName) {
    throw new Error("שם מלא הוא שדה חובה");
  }

  if (!phone) {
    throw new Error("טלפון הוא שדה חובה");
  }

  if (!message) {
    throw new Error("הודעה היא שדה חובה");
  }

  await db.insert(contactInquiries).values({
    fullName,
    phone,
    subject,
    message,
  });

  revalidatePath("/workspace/inquiries");
}
