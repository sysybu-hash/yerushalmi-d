/**
 * בדיקת עומסים ל-race conditions בשני המנגנונים הקריטיים:
 * 1. reserveStudioQuota — מכסה יומית לא אמורה לחרוג גם תחת בקשות מקבילות.
 * 2. withIdempotency — מפתח כפול לא אמור להריץ את הפעולה פעמיים.
 * רץ מול ה-DB האמיתי (DATABASE_URL), בלי שום קריאת AI בתשלום.
 * הרצה: npx tsx scripts/test-load-concurrency.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, sql } from "drizzle-orm";

import { db } from "../db";
import { siteSettings, studioActionLocks } from "../db/schema";
import { reserveStudioQuota } from "../lib/ai-usage";
import { withIdempotency } from "../lib/studio-idempotency";

const TEST_KEY_PREFIX = "loadtest";

async function setLimit(key: string, value: string) {
  await db
    .insert(siteSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
}

async function getLimit(key: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key));
  return row?.value ?? null;
}

async function resetVideoQuotaCounter() {
  // מאפס את מונה הווידאו של היום ל-0 (יוצר אם חסר) — כך שהבדיקה
  // תמיד מתחילה מ-0 בלי תלות בהרצות קודמות
  await db.execute(sql`
    INSERT INTO studio_quota_counters (day, scope_key, count)
    VALUES (current_date, 'video', 0)
    ON CONFLICT (day, scope_key) DO UPDATE SET count = 0
  `);
}

async function cleanupTestLocks() {
  const rows = await db.select().from(studioActionLocks);
  for (const row of rows) {
    if (row.key.startsWith(`action:${TEST_KEY_PREFIX}`)) {
      await db.delete(studioActionLocks).where(eq(studioActionLocks.key, row.key));
    }
  }
}

/** בדיקה 1: מכסה יומית — N בקשות מקבילות, גבול נמוך, לא אמור לחרוג */
async function testQuotaRace(): Promise<boolean> {
  console.log("\n--- בדיקה 1: מכסה יומית תחת עומס מקביל ---");

  const originalLimit = await getLimit("studioDailyVideoLimit");
  const LIMIT = 5;
  const CONCURRENT = 30;

  await resetVideoQuotaCounter();
  await setLimit("studioDailyVideoLimit", String(LIMIT));

  const results = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, () => reserveStudioQuota("video"))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");

  console.log(`${CONCURRENT} בקשות מקבילות, מכסה=${LIMIT}`);
  console.log(`הצליחו (שוריינו): ${succeeded.length}, נדחו: ${rejected.length}`);

  // שחרור כל השריונים שהצליחו (מדמה סיום מוצלח של הקריאה)
  for (const r of succeeded) {
    if (r.status === "fulfilled") await r.value.release();
  }

  await resetVideoQuotaCounter();
  if (originalLimit != null) await setLimit("studioDailyVideoLimit", originalLimit);

  const ok = succeeded.length === LIMIT;
  console.log(
    ok
      ? `✓ בדיוק ${LIMIT} שוריינו — אין חריגה ממכסה תחת עומס מקביל`
      : `✗ שוריינו ${succeeded.length} במקום ${LIMIT} — יש race condition!`
  );
  return ok;
}

/** בדיקה 2: idempotency — N קריאות מקבילות עם אותו מפתח, פעולה רצה פעם אחת */
async function testIdempotencyRace(): Promise<boolean> {
  console.log("\n--- בדיקה 2: idempotency תחת קריאות מקבילות עם אותו מפתח ---");

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

/** בדיקה 3: idempotency עם מפתחות שונים — לא אמור לחסום זה את זה */
async function testIdempotencyIndependentKeys(): Promise<boolean> {
  console.log("\n--- בדיקה 3: מפתחות שונים במקביל — לא חוסמים זה את זה ---");

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

/** בדיקה 4: עומס קיצוני — 100 בקשות מקבילות, מכסה 20 */
async function testHeavyQuotaRace(): Promise<boolean> {
  console.log("\n--- בדיקה 4: עומס קיצוני (100 בקשות, מכסה 20) ---");

  const originalLimit = await getLimit("studioDailyVideoLimit");
  const LIMIT = 20;
  const CONCURRENT = 100;

  await resetVideoQuotaCounter();
  await setLimit("studioDailyVideoLimit", String(LIMIT));

  const results = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, () => reserveStudioQuota("video"))
  );
  const succeeded = results.filter((r) => r.status === "fulfilled");

  console.log(`${CONCURRENT} בקשות מקבילות, מכסה=${LIMIT}, שוריינו=${succeeded.length}`);

  for (const r of succeeded) {
    if (r.status === "fulfilled") await r.value.release();
  }
  await resetVideoQuotaCounter();
  if (originalLimit != null) await setLimit("studioDailyVideoLimit", originalLimit);

  const ok = succeeded.length === LIMIT;
  console.log(ok ? "✓ מדויק גם בעומס גבוה" : `✗ שוריינו ${succeeded.length} במקום ${LIMIT}`);
  return ok;
}

async function run() {
  const r1 = await testQuotaRace();
  const r2 = await testIdempotencyRace();
  const r3 = await testIdempotencyIndependentKeys();
  const r4 = await testHeavyQuotaRace();

  const allPass = r1 && r2 && r3 && r4;
  console.log(allPass ? "\nALL PASS" : "\nSOME FAILURES");
  process.exit(allPass ? 0 : 1);
}

run().catch((e) => {
  console.error("שגיאה בהרצת הבדיקה:", e);
  process.exit(1);
});
