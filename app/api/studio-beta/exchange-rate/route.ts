import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getUsdToIlsRate } from "@/lib/studio-beta/exchange-rate";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, error: "פג תוקף ההתחברות — התחברו מחדש דרך /login" },
      { status: 401 }
    );
  }

  const rate = await getUsdToIlsRate();
  return NextResponse.json({ ok: true, rate });
}
