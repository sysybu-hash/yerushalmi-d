"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { SETTING_KEYS, type SettingKey } from "@/lib/site-settings";
import { requireAdmin } from "@/lib/auth";

/**
 * שמירת הגדרות האתר: upsert לכל מפתח מוכר שנשלח בטופס.
 * ערך ריק נשמר כריק — האתר יחזור לברירת המחדל עבורו.
 */
export async function saveSiteSettings(formData: FormData) {
  await requireAdmin();
  const entries: { key: SettingKey; value: string }[] = [];

  for (const key of SETTING_KEYS) {
    const raw = formData.get(key);
    if (raw !== null) {
      entries.push({ key, value: raw.toString().trim() });
    }
  }

  if (entries.length === 0) {
    throw new Error("לא נמצאו שדות לשמירה");
  }

  await db
    .insert(siteSettings)
    .values(entries)
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: sql`excluded.value`,
        updatedAt: sql`now()`,
      },
    });

  // רענון כל עמודי החנות
  revalidatePath("/", "layout");
  revalidatePath("/workspace/settings");
}
