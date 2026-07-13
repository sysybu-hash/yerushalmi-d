import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  acquireLock,
  buildLockKey,
  completeLock,
  failLock,
} from "@/lib/studio-beta/locks";
import { StudioBetaError } from "@/lib/studio-beta/errors";
import { runBackgroundPipeline } from "@/lib/studio-beta/background-pipeline";
import type { CompositePlacement } from "@/lib/studio-beta/composite";
import type { BackgroundEngineId } from "@/lib/studio-beta/engines";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  sourceImageUrl?: string;
  engine?: BackgroundEngineId;
  presetId?: string | null;
  customPrompt?: string | null;
  mode?: "catalog" | "marketing";
  cutoutUrl?: string | null;
  placement?: CompositePlacement | null;
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
  if (!body?.sourceImageUrl || !body.engine) {
    return NextResponse.json(
      {
        ok: false,
        error: "חסרה תמונת מקור או בחירת מנוע",
        code: "VALIDATION",
      },
      { status: 400 }
    );
  }

  const mode = body.mode === "marketing" ? "marketing" : "catalog";
  const placement = body.placement ?? null;
  const lockKey = buildLockKey("background", [
    body.engine,
    body.presetId ?? "",
    body.customPrompt ?? "",
    body.sourceImageUrl,
    body.cutoutUrl ?? "",
    mode,
    placement?.scale ?? "",
    placement?.offsetX ?? "",
    placement?.offsetY ?? "",
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
    const result = await runBackgroundPipeline({
      sourceImageUrl: body.sourceImageUrl,
      engine: body.engine,
      presetId: body.presetId ?? null,
      customPrompt: body.customPrompt ?? null,
      mode,
      precomputedCutoutUrl: body.cutoutUrl ?? null,
      placement,
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
