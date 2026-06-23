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

export function studioJsonError(error: unknown, fallback: string, status = 500) {
  const message = normalizeStudioError(error, fallback);
  console.error("[studio-api]", message, error);

  return NextResponse.json({ ok: false, error: message }, { status });
}
