/**
 * בדיקת עומסים ל-race conditions במנגנון הקריטי:
 * withIdempotency — מפתח כפול לא אמור להריץ את הפעולה פעמיים.
 * (מכסות יומיות הוסרו מהמערכת — ההגנה היחידה היא idempotency.)
 * רץ מול ה-DB האמיתי (DATABASE_URL), בלי שום קריאת AI בתשלום.
 * הרצה: npx tsx scripts/test-load-concurrency.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";

import { db } from "../db";
import { studioActionLocks } from "../db/schema";
import { withIdempotency } from "../lib/studio-idempotency";

const TEST_KEY_PREFIX = "loadtest";

async function cleanupTestLocks() {
  const rows = await db.select().from(studioActionLocks);
  for (const row of rows) {
    if (row.key.startsWith(`action:${TEST_KEY_PREFIX}`)) {
      await db.delete(studioActionLocks).where(eq(studioActionLocks.key, row.key));
    }
  }
}

/** בדיקה 1: idempotency תחת קריאות מקבילות עם אותו מפתח */
async function testIdempotencyRace(): Promise<boolean> {
  console.log("\n--- בדיקה 1: idempotency תחת קריאות מקבילות עם אותו מפתח ---");

  const key = `${TEST_KEY_PREFIX}-${Date.now()}`;
  const CONCURRENT = 20;
  let actualRuns = 0;

  const slowPaidAction = async () => {
    actualRuns++;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { url: "https://example.com/result.png", ranAt: Date.now() };
  };

  const results = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, () => withIdempotency(key, slowPaidAction))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled");
  const conflicted = results.filter(
    (r) => r.status === "rejected" && /כבר רצה/.test(String((r as PromiseRejectedResult).reason))
  );

  console.log(`${CONCURRENT} קריאות מקבילות עם מפתח זהה`);
  console.log(`הפעולה בפועל רצה: ${actualRuns} פעם/ים`);
  console.log(`הצליחו (כולל דה-דופ): ${succeeded.length}, נחסמו כ-409: ${conflicted.length}`);

  await cleanupTestLocks();

  const ok = actualRuns === 1;
  console.log(
    ok
      ? "✓ הפעולה בתשלום רצה פעם אחת בלבד — אין סיכון לחיוב כפול"
      : `✗ הפעולה רצה ${actualRuns} פעמים — סיכון לחיוב כפול!`
  );
  return ok;
}

/** בדיקה 2: idempotency עם מפתחות שונים — לא אמור לחסום זה את זה */
async function testIdempotencyIndependentKeys(): Promise<boolean> {
  console.log("\n--- בדיקה 2: מפתחות שונים במקביל — לא חוסמים זה את זה ---");

  const CONCURRENT = 15;
  let actualRuns = 0;

  const start = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, (_, i) =>
      withIdempotency(`${TEST_KEY_PREFIX}-independent-${i}-${Date.now()}`, async () => {
        actualRuns++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { url: "ok" };
      })
    )
  );
  const elapsed = Date.now() - start;

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(`${CONCURRENT} מפתחות שונים, ${succeeded} הצליחו, זמן כולל: ${elapsed}ms`);
  await cleanupTestLocks();

  const ok = actualRuns === CONCURRENT && elapsed < 2000;
  console.log(
    ok
      ? "✓ כל המפתחות רצו במקביל בלי לחסום זה את זה"
      : "✗ יש חסימה לא צפויה בין מפתחות שונים"
  );
  return ok;
}

async function run() {
  const r1 = await testIdempotencyRace();
  const r2 = await testIdempotencyIndependentKeys();

  const allPass = r1 && r2;
  console.log(allPass ? "\nALL PASS" : "\nSOME FAILURES");
  process.exit(allPass ? 0 : 1);
}

run().catch((e) => {
  console.error("שגיאה בהרצת הבדיקה:", e);
  process.exit(1);
});
