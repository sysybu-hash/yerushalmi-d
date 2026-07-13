"use server";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { aiMediaAssets, studioBetaProjects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import type { StudioBetaProjectState } from "@/lib/studio-beta/store";

type SaveInput = {
  mediaType: "image" | "video";
  originalUrl: string;
  generatedUrl: string;
  title?: string | null;
};

/** שלב 4: שמירה לספריית התוכן הגנרית — בלי פרסום ישיר לדף מכירות */
export async function saveStudioBetaAsset(
  input: SaveInput
): Promise<{ id: number }> {
  await requireAdmin();

  const [row] = await db
    .insert(aiMediaAssets)
    .values({
      mediaType: input.mediaType,
      originalUrl: input.originalUrl,
      generatedUrl: input.generatedUrl,
      title: input.title ?? null,
      status: "draft",
    })
    .returning({ id: aiMediaAssets.id });

  return { id: row.id };
}

type SaveProjectInput = {
  id?: number | null;
  title?: string | null;
  sourceImageUrl: string;
  thumbnailUrl?: string | null;
  state: StudioBetaProjectState;
};

/** שמירת/עדכון מצב עבודה מלא — מאפשר לחזור ולהמשיך פרויקט מאוחר יותר */
export async function saveStudioBetaProject(
  input: SaveProjectInput
): Promise<{ id: number }> {
  await requireAdmin();

  if (input.id) {
    const [updated] = await db
      .update(studioBetaProjects)
      .set({
        title: input.title || undefined,
        sourceImageUrl: input.sourceImageUrl,
        thumbnailUrl: input.thumbnailUrl ?? null,
        state: input.state,
        updatedAt: new Date(),
      })
      .where(eq(studioBetaProjects.id, input.id))
      .returning({ id: studioBetaProjects.id });

    if (updated) return { id: updated.id };
  }

  const [created] = await db
    .insert(studioBetaProjects)
    .values({
      title: input.title || "עבודה חדשה",
      sourceImageUrl: input.sourceImageUrl,
      thumbnailUrl: input.thumbnailUrl ?? null,
      state: input.state,
    })
    .returning({ id: studioBetaProjects.id });

  return { id: created.id };
}

/** רשימת פרויקטים קודמים לבחירה — מהחדש לישן */
export async function listStudioBetaProjects() {
  await requireAdmin();
  return db
    .select()
    .from(studioBetaProjects)
    .orderBy(desc(studioBetaProjects.updatedAt));
}

/** מחיקת פרויקט שמור */
export async function deleteStudioBetaProject(id: number) {
  await requireAdmin();

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("מזהה פרויקט לא תקין");
  }

  await db.delete(studioBetaProjects).where(eq(studioBetaProjects.id, id));
}

/**
 * מילוי כותרת אוטומטי ב-AI לתמונת תוצאה — שימוש חוזר ב-lib/listing-ai.ts
 * (אותה פונקציה שסטודיו AI וספריית התוכן כבר קוראים לה), לא pipeline חדש.
 */
export async function generateStudioBetaTitle(
  imageUrl: string
): Promise<{ title: string }> {
  await requireAdmin();

  if (!imageUrl.startsWith("https://res.cloudinary.com/")) {
    throw new Error("נדרשת תמונה שמורה ב-Cloudinary");
  }

  const { generateListingContent } = await import("@/lib/listing-ai");
  const result = await generateListingContent({
    imageUrls: [imageUrl],
    mode: "fill",
  });

  return { title: result.title };
}
