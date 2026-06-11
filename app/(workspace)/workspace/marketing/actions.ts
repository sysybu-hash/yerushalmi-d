"use server";

import { desc, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { campaigns, customers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const CAMPAIGN_TYPES = ["email", "sms"] as const;
type CampaignType = (typeof CAMPAIGN_TYPES)[number];

/** שליפת כל הקמפיינים, מהחדש לישן */
export async function getCampaigns() {
  await requireAdmin();
  return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

/** יצירת טיוטת קמפיין חדשה מתוך טופס */
export async function createCampaign(formData: FormData) {
  await requireAdmin();
  const title = formData.get("title")?.toString().trim();
  const content = formData.get("content")?.toString().trim();
  const type = formData.get("type")?.toString() as CampaignType;

  if (!title) {
    throw new Error("שם הקמפיין הוא שדה חובה");
  }

  if (!content) {
    throw new Error("תוכן ההודעה הוא שדה חובה");
  }

  if (!CAMPAIGN_TYPES.includes(type)) {
    throw new Error("יש לבחור ערוץ דיוור");
  }

  await db.insert(campaigns).values({ title, content, type });

  revalidatePath("/workspace/marketing");
}

/** עדכון קמפיין — רק טיוטות */
export async function updateCampaign(id: number, formData: FormData) {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("מזהה קמפיין לא תקין");
  }

  const [existing] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id));

  if (!existing) {
    throw new Error("הקמפיין לא נמצא");
  }

  if (existing.status !== "draft") {
    throw new Error("ניתן לערוך רק קמפיינים בטיוטה");
  }

  const title = formData.get("title")?.toString().trim();
  const content = formData.get("content")?.toString().trim();
  const type = formData.get("type")?.toString() as CampaignType;

  if (!title) {
    throw new Error("שם הקמפיין הוא שדה חובה");
  }

  if (!content) {
    throw new Error("תוכן ההודעה הוא שדה חובה");
  }

  if (!CAMPAIGN_TYPES.includes(type)) {
    throw new Error("יש לבחור ערוץ דיוור");
  }

  await db
    .update(campaigns)
    .set({ title, content, type })
    .where(eq(campaigns.id, id));

  revalidatePath("/workspace/marketing");
}

/** מחיקת קמפיין — רק טיוטות */
export async function deleteCampaign(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("מזהה קמפיין לא תקין");
  }

  const [existing] = await db
    .select({ status: campaigns.status })
    .from(campaigns)
    .where(eq(campaigns.id, id));

  if (!existing) {
    throw new Error("הקמפיין לא נמצא");
  }

  if (existing.status !== "draft") {
    throw new Error("ניתן למחוק רק קמפיינים בטיוטה");
  }

  await db.delete(campaigns).where(eq(campaigns.id, id));

  revalidatePath("/workspace/marketing");
}

/**
 * שליחת קמפיין לכל הלקוחות.
 * כרגע מדמה את השליחה (לוג של ה־payload) — מוכן לחיבור
 * Resend (אימייל) או ספק SMS ישראלי (019/InforU) בהמשך.
 */
export async function sendCampaign(campaignId: number) {
  await requireAdmin();
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new Error("מזהה קמפיין לא תקין");
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

  if (!campaign) {
    throw new Error("הקמפיין לא נמצא");
  }

  if (campaign.status === "sent") {
    throw new Error("הקמפיין כבר נשלח");
  }

  const recipients =
    campaign.type === "email"
      ? await db
          .select({ name: customers.fullName, to: customers.email })
          .from(customers)
          .where(isNotNull(customers.email))
      : await db
          .select({ name: customers.fullName, to: customers.phone })
          .from(customers)
          .where(isNotNull(customers.phone));

  if (recipients.length === 0) {
    throw new Error("אין לקוחות עם פרטי קשר מתאימים לערוץ זה");
  }

  console.log(
    `[שיווק] שולח קמפיין "${campaign.title}" בערוץ ${campaign.type} ל־${recipients.length} נמענים`,
    {
      campaignId: campaign.id,
      subject: campaign.title,
      body: campaign.content,
      recipients: recipients.slice(0, 5),
    }
  );

  await db
    .update(campaigns)
    .set({ status: "sent" })
    .where(eq(campaigns.id, campaignId));

  revalidatePath("/workspace/marketing");

  return { sentTo: recipients.length };
}
