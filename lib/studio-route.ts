import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { normalizeStudioError } from "@/lib/studio-replicate";

export async function studioRouteGuard() {
  try {
    await requireAdmin();
    return null;
  } catch {
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
  return NextResponse.json(
    { ok: false, error: normalizeStudioError(error, fallback) },
    { status }
  );
}
