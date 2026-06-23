"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { studioProjects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  EMPTY_STUDIO_SNAPSHOT,
  normalizeSnapshot,
  snapshotThumbnailUrl,
  type StudioProjectSnapshot,
} from "@/lib/studio-project-snapshot";

export type StudioProjectListItem = {
  id: number;
  title: string;
  mode: "create" | "edit";
  status: "draft" | "in_progress" | "ready" | "published";
  thumbnailUrl: string | null;
  updatedAt: Date;
  publishedAt: Date | null;
};

function deriveStatus(
  snapshot: StudioProjectSnapshot,
  publishedAt: Date | null
): StudioProjectListItem["status"] {
  if (publishedAt) return "published";
  const normalized = normalizeSnapshot(snapshot);

  if (normalized.mode === "edit") {
    if (!normalized.edit.asset) return "draft";
    if (normalized.edit.savedUrl) return "ready";
    return "in_progress";
  }

  const { state } = normalized;
  if (state.status === "empty") return "draft";
  if (state.status === "done" && state.savedUrl) return "ready";
  return "in_progress";
}

function defaultTitle(snapshot: StudioProjectSnapshot): string {
  const normalized = normalizeSnapshot(snapshot);

  if (normalized.mode === "edit") {
    if (normalized.edit.productTitle.trim()) {
      return normalized.edit.productTitle.trim();
    }
    if (normalized.edit.asset?.type === "video") return "עריכת וידאו";
    if (normalized.edit.asset) return "עריכת תמונה";
    return "עריכה חדשה";
  }

  if (normalized.productTitle.trim()) return normalized.productTitle.trim();
  if (normalized.state.status === "done" && normalized.state.kind === "video") {
    return "וידאו תכשיט";
  }
  if ("source" in normalized.state && normalized.state.source) {
    return "עבודת סטודיו";
  }
  return "עבודה חדשה";
}

export async function listStudioProjects(): Promise<StudioProjectListItem[]> {
  await requireAdmin();

  const rows = await db
    .select()
    .from(studioProjects)
    .orderBy(desc(studioProjects.updatedAt));

  return rows.map((row) => {
    const snapshot = normalizeSnapshot(row.snapshot);
    return {
      id: row.id,
      title: row.title,
      mode: snapshot.mode,
      status: deriveStatus(snapshot, row.publishedAt),
      thumbnailUrl: row.thumbnailUrl,
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt,
    };
  });
}

export async function getStudioProject(id: number) {
  await requireAdmin();

  const [row] = await db
    .select()
    .from(studioProjects)
    .where(eq(studioProjects.id, id))
    .limit(1);

  if (!row) {
    throw new Error("העבודה לא נמצאה");
  }

  return { ...row, snapshot: normalizeSnapshot(row.snapshot) };
}

export async function createStudioProject(
  snapshot: StudioProjectSnapshot = EMPTY_STUDIO_SNAPSHOT,
  title?: string
) {
  await requireAdmin();

  const normalized = normalizeSnapshot(snapshot);

  const [created] = await db
    .insert(studioProjects)
    .values({
      title: title?.trim() || defaultTitle(normalized),
      status: deriveStatus(normalized, null),
      thumbnailUrl: snapshotThumbnailUrl(normalized),
      snapshot: normalized,
    })
    .returning();

  revalidatePath("/studio");
  return created;
}

export async function saveStudioProject(
  id: number,
  snapshot: StudioProjectSnapshot,
  title?: string
) {
  await requireAdmin();

  const [existing] = await db
    .select({ publishedAt: studioProjects.publishedAt })
    .from(studioProjects)
    .where(eq(studioProjects.id, id))
    .limit(1);

  if (!existing) {
    throw new Error("העבודה לא נמצאה");
  }

  const normalized = normalizeSnapshot(snapshot);
  const nextTitle = title?.trim();
  const [updated] = await db
    .update(studioProjects)
    .set({
      ...(nextTitle ? { title: nextTitle } : {}),
      status: deriveStatus(normalized, existing.publishedAt),
      thumbnailUrl: snapshotThumbnailUrl(normalized),
      snapshot: normalized,
      updatedAt: new Date(),
    })
    .where(eq(studioProjects.id, id))
    .returning();

  revalidatePath("/studio");
  return updated;
}

export async function renameStudioProject(id: number, title: string) {
  await requireAdmin();

  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("יש להזין שם לעבודה");
  }

  const [updated] = await db
    .update(studioProjects)
    .set({ title: trimmed, updatedAt: new Date() })
    .where(eq(studioProjects.id, id))
    .returning();

  if (!updated) {
    throw new Error("העבודה לא נמצאה");
  }

  revalidatePath("/studio");
  return updated;
}

export async function deleteStudioProject(id: number) {
  await requireAdmin();

  await db.delete(studioProjects).where(eq(studioProjects.id, id));
  revalidatePath("/studio");
}

export async function markStudioProjectPublished(
  id: number,
  outcome:
    | { kind: "site"; settingKey: string }
    | { kind: "catalog"; productId: number }
) {
  await requireAdmin();

  const [updated] = await db
    .update(studioProjects)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
      publishedSettingKey:
        outcome.kind === "site" ? outcome.settingKey : null,
      publishedProductId:
        outcome.kind === "catalog" ? outcome.productId : null,
    })
    .where(eq(studioProjects.id, id))
    .returning();

  revalidatePath("/studio");
  return updated;
}
