import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  acquireLock,
  buildLockKey,
  completeLock,
  failLock,
} from "@/lib/studio-beta/locks";
import { StudioBetaError } from "@/lib/studio-beta/errors";
import { runVideoPipeline } from "@/lib/studio-beta/video-pipeline";
import type { VideoEngineId } from "@/lib/studio-beta/engines";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  imageUrl?: string;
  engine?: VideoEngineId;
  durationSec?: number;
  customPrompt?: string | null;
  mode?: "catalog" | "marketing";
  negativePrompt?: string | null;
  generateAudio?: boolean;
};

const HTTP_STATUS_FOR_CODE: Record<StudioBetaError["code"], number> = {
  VALIDATION: 400,
  PROVIDER_NOT_CONFIGURED: 400,
  PROVIDER_NO_CREDIT: 402,
  PROVIDER_ERROR: 500,
  IN_PROGRESS: 409,
};

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
  if (!body?.imageUrl || !body.engine) {
    return NextResponse.json(
      { ok: false, error: "חסרה תמונה או בחירת מנוע וידאו", code: "VALIDATION" },
      { status: 400 }
    );
  }

  const mode = body.mode === "marketing" ? "marketing" : "catalog";
  const durationSec = body.durationSec ?? 8;
  const lockKey = buildLockKey("video", [
    body.engine,
    body.imageUrl,
    durationSec,
    body.customPrompt ?? "",
    body.negativePrompt ?? "",
    Boolean(body.generateAudio),
    mode,
  ]);

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
    const result = await runVideoPipeline({
      imageUrl: body.imageUrl,
      engine: body.engine,
      durationSec,
      customPrompt: body.customPrompt ?? null,
      mode,
      negativePrompt: body.negativePrompt ?? null,
      generateAudio: Boolean(body.generateAudio),
    });
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
