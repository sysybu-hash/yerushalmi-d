import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCloudinaryUsage } from "@/lib/cloudinary-server";

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

  const usage = await getCloudinaryUsage();
  if (!usage) {
    return NextResponse.json(
      { ok: false, error: "לא ניתן היה לקרוא את נתוני השימוש מ-Cloudinary" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, usage });
}
