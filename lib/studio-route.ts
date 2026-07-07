import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { normalizeStudioError } from "@/lib/studio-replicate";

export async function studioRouteGuard() {
  try {
    await requireAdmin();
    return null;
  } catch (error) {
    const message =
      error instanceof Error ? error.message.trim() : "Unauthorized";

    if (message === "JWT_SECRET is not set") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "JWT_SECRET חסר ב-Vercel — הוסיפו משתנה סביבה לסביבת Production.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "פג תוקף ההתחברות — התחברו מחדש דרך /login" },
      { status: 401 }
    );
  }
}

export function studioJsonOk<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

/**
 * שגיאה שכדאי לנסות שוב (רשת/עומס זמני) — הלקוח רשאי retry אוטומטי
 * עם אותו מפתח idempotency. שגיאות הרשאה/מכסה/קלט אינן retryable.
 */
export function isRetryableStudioError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (
    /401|402|unauthorized|insufficient credit|quota|מכסה|JWT|חסר|לא תקין|לא מוגדר/i.test(
      message
    )
  ) {
    return false;
  }
  return /timeout|timed out|aborted|fetch failed|ECONNRESET|ETIMEDOUT|503|504|502|500|rate limit|overloaded|try again|נסו שוב/i.test(
    message
  );
}

export function studioJsonError(error: unknown, fallback: string, status = 500) {
  const message = normalizeStudioError(error, fallback);
  console.error("[studio-api]", message, error);

  return NextResponse.json(
    { ok: false, error: message, retryable: isRetryableStudioError(error) },
    { status }
  );
}
