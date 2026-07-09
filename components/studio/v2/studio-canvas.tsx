"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeftRight, Loader2 } from "lucide-react";

import type { StudioV2State } from "@/lib/studio-client/state";
import { cutoutDisplayUrl, sourceDisplayUrl } from "@/lib/cloudinary-url";
import { buildTransformedUrl, DEFAULT_IMAGE_ADJUSTMENTS } from "@/lib/studio-transform";
import { cn } from "@/lib/utils";

const BUSY_LABELS: Record<string, string> = {
  upload: "מעלה את הצילום…",
  cutout: "מבודד את התכשיט מהרקע…",
  preview: "יוצר תמונת קטלוג…",
  image: "יוצר את התמונה הסופית…",
  video: "יוצר וידאו — זה יכול לקחת עד 5 דקות…",
  enhance: "משפר את הצילום…",
};

function canvasLabel(state: StudioV2State, base: string): string {
  if (base === "תוצאה" && state.result.kind === "video") return "וידאו מוכן";
  if (base === "תוצאה") return "תמונה מוכנה";
  if (base === "תצוגה מקדימה (חינם)") {
    if (state.result.url && state.preview.url === state.result.url) {
      return "תמונה מוכנה";
    }
    if (state.useAiBackground && state.flow === "catalog") {
      return "טיוטה פרוצדורלית";
    }
    return "טיוטה";
  }
  if (base === "לפני") return "לפני (צילום מקורי)";
  return base;
}

function canvasBackgroundClass(state: StudioV2State, layer: string): string {
  if (layer === "לפני" || layer === "תכשיט מבודד") {
    return "bg-white";
  }
  if (layer === "תוצאה" || layer === "תצוגה מקדימה (חינם)") {
    return "bg-neutral-200";
  }
  return "bg-neutral-100";
}

/**
 * הקנבס המרכזי — מציג את השכבה המתקדמת ביותר עם מתג לפני/אחרי.
 */
export function StudioCanvas({ state }: { state: StudioV2State }) {
  const [showBefore, setShowBefore] = React.useState(false);
  const [mediaError, setMediaError] = React.useState<string | null>(null);

  const beforeUrl = React.useMemo(() => {
    const raw = state.source.originalUrl ?? state.source.url;
    if (!raw) return null;
    return sourceDisplayUrl(raw);
  }, [state.source.originalUrl, state.source.url]);

  const current = React.useMemo(() => {
    if (state.selectedAttemptId) {
      const attempt = state.attempts.find(
        (a) => a.id === state.selectedAttemptId
      );
      if (attempt) {
        return {
          url: attempt.url,
          kind: attempt.kind,
          label: attempt.label,
        };
      }
    }
    if (state.result.url && state.result.kind === "video") {
      return { url: state.result.url, kind: "video" as const, label: "תוצאה" };
    }
    if (state.result.url) {
      const url =
        state.resultAspect !== "original"
          ? buildTransformedUrl(state.result.url, "image", {
              ...DEFAULT_IMAGE_ADJUSTMENTS,
              autoEnhance: false,
              autoColor: false,
              sharpen: false,
              contrast: 0,
              upscale: false,
              aspect: state.resultAspect,
            })
          : state.result.url;
      return { url, kind: "image" as const, label: "תוצאה" };
    }
    if (state.preview.url) {
      return {
        url: state.preview.url,
        kind: state.preview.kind,
        label: "תצוגה מקדימה (חינם)",
      };
    }
    if (state.cutout.url) {
      return {
        url: cutoutDisplayUrl(state.cutout.url),
        kind: "image" as const,
        label: "תכשיט מבודד",
      };
    }
    if (state.source.url) {
      return {
        url: sourceDisplayUrl(state.source.url),
        kind: state.source.kind,
        label: "מקור",
      };
    }
    return null;
  }, [
    state.selectedAttemptId,
    state.attempts,
    state.result,
    state.resultAspect,
    state.preview,
    state.cutout.url,
    state.source,
  ]);

  const canCompare =
    Boolean(beforeUrl) &&
    Boolean(current?.url) &&
    beforeUrl !== current?.url &&
    current?.kind === "image";

  const displayed =
    showBefore && canCompare && beforeUrl
      ? { url: beforeUrl, kind: "image" as const, label: "לפני" }
      : current;

  const badgeLabel = displayed
    ? canvasLabel(state, displayed.label)
    : null;

  const bgClass = displayed
    ? canvasBackgroundClass(state, displayed.label)
    : "bg-neutral-100";

  return (
    <div
      className={cn(
        "relative flex aspect-square w-full items-center justify-center overflow-hidden border border-border/60",
        bgClass
      )}
    >
      {displayed ? (
        displayed.kind === "video" ? (
          <video
            key={displayed.url}
            src={displayed.url}
            controls
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setMediaError(null)}
            onError={() =>
              setMediaError(
                "הווידאו לא נטען — ייתכן שהקובץ עדיין בעיבוד או שהקישור פג. נסו לרענן או ליצור מחדש."
              )
            }
            className="h-full w-full object-contain"
          />
        ) : (
          <Image
            src={displayed.url}
            alt={badgeLabel ?? displayed.label}
            fill
            className="pointer-events-none select-none object-contain outline-none"
            sizes="(min-width: 1024px) 60vw, 100vw"
            unoptimized
            draggable={false}
            onLoad={() => setMediaError(null)}
            onError={() =>
              setMediaError("התמונה לא נטענה — נסו לרענן או ליצור מחדש.")
            }
          />
        )
      ) : (
        <p className="px-8 text-center text-sm font-light text-muted-foreground">
          העלו צילום כדי להתחיל — התצוגה תופיע כאן
        </p>
      )}

      {badgeLabel && (
        <span className="absolute right-2 top-2 bg-black/60 px-2 py-0.5 text-[10px] font-light text-white">
          {badgeLabel}
        </span>
      )}

      {mediaError && displayed && (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 border border-amber-400 bg-amber-50/95 px-4 py-3 text-center text-sm font-light text-amber-800">
          {mediaError}
        </div>
      )}

      {canCompare && (
        <button
          type="button"
          onPointerDown={() => setShowBefore(true)}
          onPointerUp={() => setShowBefore(false)}
          onPointerLeave={() => setShowBefore(false)}
          onPointerCancel={() => setShowBefore(false)}
          className={cn(
            "absolute bottom-2 right-2 z-10 flex items-center gap-1 border px-3 py-1 text-[11px] font-light backdrop-blur",
            showBefore
              ? "border-gold bg-gold/80 text-black"
              : "border-white/40 bg-black/50 text-white hover:bg-black/70"
          )}
        >
          <ArrowLeftRight className="h-3 w-3" />
          לחצו והחזיקו: לפני / אחרי
        </button>
      )}

      {state.busyAction && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
          <Loader2 className="h-7 w-7 animate-spin text-gold" />
          <p className="px-6 text-center text-sm font-light text-white">
            {BUSY_LABELS[state.busyAction] ?? "עובד…"}
          </p>
        </div>
      )}
    </div>
  );
}
