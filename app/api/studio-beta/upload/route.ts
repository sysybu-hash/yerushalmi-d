import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/studio-beta/cloudinary-upload";

/**
 * מעטפת דקה סביב uploadToCloudinary הקיים לשימוש מהדפדפן — מחליף את
 * ה-Upload Widget המוטמע של Cloudinary (אנגלית בלבד) בממשק העלאה עצמאי
 * בעברית מלאה. בלי idempotency-lock — זו העלאה רגילה, לא פעולת AI
 * בתשלום שדורשת דה-דופ.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, error: "פג תוקף ההתחברות — התחברו מחדש דרך /login" },
      { status: 401 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "לא נשלח קובץ" },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { ok: false, error: "יש להעלות קובץ תמונה בלבד" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "הקובץ גדול מדי — הגודל המקסימלי הוא 15MB" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    const uploaded = await uploadToCloudinary({
      source: dataUri,
      resourceType: "image",
      filenamePrefix: "studio-beta-upload",
    });
    return NextResponse.json({ ok: true, url: uploaded.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "העלאה נכשלה";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
