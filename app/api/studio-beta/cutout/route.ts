import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  acquireLock,
  buildLockKey,
  completeLock,
  failLock,
} from "@/lib/studio-beta/locks";
import { StudioBetaError } from "@/lib/studio-beta/errors";
import { attemptCutout } from "@/lib/studio-beta/cutout";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  sourceImageUrl?: string;
  mode?: "catalog" | "marketing";
};

const HTTP_STATUS_FOR_CODE: Record<StudioBetaError["code"], number> = {
  VALIDATION: 400,
  PROVIDER_NOT_CONFIGURED: 400,
  PROVIDER_NO_CREDIT: 402,
  PROVIDER_ERROR: 500,
  IN_PROGRESS: 409,
};

/**
 * שער בידוד ידני — שלב 2 (חלק): בידוד עצמאי ונפרד מהרכבת הרקע, כדי
 * שהמשתמש יוכל לאשר או לנסות שוב לפני שממשיכים לרקע. attemptCutout
 * עצמו best-effort (לא זורק, מחזיר null בכשל) — כאן, בניגוד לשימוש
 * הפנימי בתוך background-pipeline, הכישלון כן גלוי למשתמש (יש כפתור
 * "נסה שוב"), אז מתרגמים null ל-ok:false עם הודעה ברורה.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, error: "פג תוקף ההתחברות — התחברו מחדש דרך /login" },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.sourceImageUrl) {
    return NextResponse.json(
      { ok: false, error: "חסרה תמונת מקור", code: "VALIDATION" },
      { status: 400 }
    );
  }

  const mode = body.mode === "marketing" ? "marketing" : "catalog";
  const lockKey = buildLockKey("cutout", [body.sourceImageUrl, mode]);

  let lock;
  try {
    lock = await acquireLock(lockKey);
  } catch (error) {
    if (error instanceof StudioBetaError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: HTTP_STATUS_FOR_CODE[error.code] }
      );
    }
    throw error;
  }

  if (lock.status === "cached") {
    return NextResponse.json({ ok: true, ...lock.result, cached: true });
  }

  try {
    const result = await attemptCutout(body.sourceImageUrl, mode);
    if (!result) {
      await failLock(lockKey);
      return NextResponse.json(
        {
          ok: false,
          error: "הבידוד לא הצליח — אפשר לנסות שוב או להמשיך בלי בידוד ידני",
          code: "PROVIDER_ERROR",
        },
        { status: 500 }
      );
    }
    await completeLock(lockKey, result);
    return NextResponse.json({ ok: true, ...result, cached: false });
  } catch (error) {
    await failLock(lockKey);
    if (error instanceof StudioBetaError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: HTTP_STATUS_FOR_CODE[error.code] }
      );
    }
    const message = error instanceof Error ? error.message : "שגיאה לא צפויה";
    return NextResponse.json(
      { ok: false, error: message, code: "PROVIDER_ERROR" },
      { status: 500 }
    );
  }
}
