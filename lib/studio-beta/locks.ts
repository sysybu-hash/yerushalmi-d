import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studioBetaActionLocks } from "@/db/schema";
import { StudioBetaError } from "@/lib/studio-beta/errors";

const PENDING_TTL_MS = 6 * 60 * 1000; // מעל maxDuration המרבי (וידאו)

export type LockAcquireResult =
  | { status: "acquired" }
  | { status: "cached"; result: Record<string, unknown> };

/**
 * נעילת idempotency אטומית — UPSERT (לא read-then-write), מונעת חיוב
 * כפול על ריטריי/לחיצה כפולה בלבד (לא הגנת-עלות חוסמת). נעילת pending
 * "מתה" (ישנה מ-6 דקות, למשל מקריסה) משוחררת אוטומטית כדי שריטריי
 * לעולם לא ייתקע מול נעילה מתה.
 */
export async function acquireLock(key: string): Promise<LockAcquireResult> {
  const inserted = await db
    .insert(studioBetaActionLocks)
    .values({ key, status: "pending" })
    .onConflictDoNothing({ target: studioBetaActionLocks.key })
    .returning();

  if (inserted.length > 0) {
    return { status: "acquired" };
  }

  const [existing] = await db
    .select()
    .from(studioBetaActionLocks)
    .where(eq(studioBetaActionLocks.key, key));

  if (!existing) {
    return acquireLock(key);
  }

  if (existing.status === "done") {
    return { status: "cached", result: existing.resultJson ?? {} };
  }

  const ageMs = Date.now() - existing.updatedAt.getTime();
  if (existing.status === "error" || ageMs > PENDING_TTL_MS) {
    await db
      .update(studioBetaActionLocks)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(studioBetaActionLocks.key, key));
    return { status: "acquired" };
  }

  throw new StudioBetaError(
    "IN_PROGRESS",
    "הפעולה כבר רצה — המתינו לתוצאה ונסו שוב בעוד רגע"
  );
}

export async function completeLock(
  key: string,
  result: Record<string, unknown>
): Promise<void> {
  await db
    .update(studioBetaActionLocks)
    .set({ status: "done", resultJson: result, updatedAt: new Date() })
    .where(eq(studioBetaActionLocks.key, key));
}

export async function failLock(key: string): Promise<void> {
  await db
    .update(studioBetaActionLocks)
    .set({ status: "error", updatedAt: new Date() })
    .where(eq(studioBetaActionLocks.key, key));
}

/** מפתח נעילה דטרמיניסטי: תווית שלב קריאה + hash קצר של שאר הקלט */
export function buildLockKey(
  step: string,
  parts: (string | number | boolean | null | undefined)[]
): string {
  const raw = parts.map((part) => String(part ?? "")).join("::");
  const hash = createHash("sha1").update(raw).digest("hex").slice(0, 16);
  return `${step}:${hash}`;
}
