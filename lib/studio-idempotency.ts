import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { studioActionLocks } from "@/db/schema";

/** פעולה בתשלום שכבר רצה עם אותו מפתח — אין להריץ שוב */
export class IdempotencyConflictError extends Error {
  constructor() {
    super("הפעולה כבר רצה — המתינו לסיום, אין צורך ללחוץ שוב");
    this.name = "IdempotencyConflictError";
  }
}

/** זמן מקסימלי שנעילת pending נחשבת חיה (וידאו רץ עד 300 שניות) */
const PENDING_TTL_MS = 15 * 60 * 1000;

function normalizeKey(prefix: string, raw: string): string {
  const trimmed = raw.trim();
  const safe =
    trimmed.length <= 100 && /^[\w-]+$/.test(trimmed)
      ? trimmed
      : createHash("sha1").update(trimmed).digest("hex");
  return `${prefix}:${safe}`;
}

/**
 * מריץ פעולה בתשלום פעם אחת בלבד לכל מפתח idempotency.
 * מפתח כפול בזמן ריצה → IdempotencyConflictError (409);
 * מפתח שהושלם → מחזיר את התוצאה השמורה בלי חיוב חוזר;
 * בלי מפתח → ריצה רגילה (תאימות לאחור).
 */
export async function withIdempotency<T extends Record<string, unknown>>(
  idempotencyKey: string | undefined | null,
  run: () => Promise<T>
): Promise<T & { deduplicated?: boolean }> {
  if (!idempotencyKey?.trim()) return run();

  const key = normalizeKey("action", idempotencyKey);

  let acquired: { key: string }[] = [];
  try {
    acquired = await db
      .insert(studioActionLocks)
      .values({ key, status: "pending" })
      .onConflictDoNothing()
      .returning({ key: studioActionLocks.key });
  } catch (error) {
    // תקלת DB לא חוסמת את הפעולה עצמה — רק מוותרת על ההגנה
    console.error("studio_idempotency_acquire_failed", error);
    return run();
  }

  if (acquired.length === 0) {
    const [row] = await db
      .select()
      .from(studioActionLocks)
      .where(eq(studioActionLocks.key, key));

    if (row) {
      if (row.status === "done" && row.resultJson) {
        return { ...(row.resultJson as T), deduplicated: true };
      }
      const ageMs = Date.now() - new Date(row.updatedAt).getTime();
      if (row.status === "pending" && ageMs < PENDING_TTL_MS) {
        throw new IdempotencyConflictError();
      }
      // נעילה ישנה או כושלת — משתלטים ומריצים מחדש (retry מכוון עם אותו מפתח)
      await db
        .update(studioActionLocks)
        .set({ status: "pending", resultJson: null, updatedAt: new Date() })
        .where(eq(studioActionLocks.key, key));
    }
  }

  try {
    const result = await run();
    try {
      await db
        .update(studioActionLocks)
        .set({ status: "done", resultJson: result, updatedAt: new Date() })
        .where(eq(studioActionLocks.key, key));
    } catch (error) {
      console.error("studio_idempotency_store_failed", error);
    }
    return result;
  } catch (error) {
    try {
      await db
        .update(studioActionLocks)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(studioActionLocks.key, key));
    } catch (updateError) {
      console.error("studio_idempotency_error_mark_failed", updateError);
    }
    throw error;
  }
}

/** מפתח מטמון מתמיד (משתמש באותה טבלה) — למשל cutout לפי כתובת מקור */
export function persistentCacheKey(prefix: string, value: string): string {
  return normalizeKey(prefix, value);
}

export async function readPersistentCache(
  key: string
): Promise<Record<string, unknown> | null> {
  try {
    const [row] = await db
      .select()
      .from(studioActionLocks)
      .where(eq(studioActionLocks.key, key));
    if (row?.status === "done" && row.resultJson) return row.resultJson;
    return null;
  } catch (error) {
    console.error("studio_persistent_cache_read_failed", error);
    return null;
  }
}

export async function writePersistentCache(
  key: string,
  value: Record<string, unknown>
): Promise<void> {
  try {
    await db
      .insert(studioActionLocks)
      .values({ key, status: "done", resultJson: value })
      .onConflictDoUpdate({
        target: studioActionLocks.key,
        set: { status: "done", resultJson: value, updatedAt: new Date() },
      });
  } catch (error) {
    console.error("studio_persistent_cache_write_failed", error);
  }
}
