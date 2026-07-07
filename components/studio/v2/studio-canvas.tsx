"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import type { StudioV2State } from "@/lib/studio-client/state";
import { cutoutDisplayUrl } from "@/lib/cloudinary-url";
import { cn } from "@/lib/utils";

const BUSY_LABELS: Record<string, string> = {
  upload: "מעלה את הצילום…",
  cutout: "מבודד את התכשיט מהרקע…",
  preview: "מרכיב תצוגה מקדימה — ללא עלות…",
  image: "יוצר את התמונה הסופית…",
  video: "יוצר וידאו — זה יכול לקחת עד 5 דקות…",
  enhance: "משפר את הצילום…",
};

/**
 * הקנבס המרכזי — מציג את השכבה המתקדמת ביותר:
 * תוצאה > תצוגה מקדימה > cutout > מקור. עם מתג "לפני/אחרי".
 */
export function StudioCanvas({ state }: { state: StudioV2State }) {
  const [showBefore, setShowBefore] = React.useState(false);

  const current = React.useMemo(() => {
    if (state.result.url && state.result.kind === "video") {
      return { url: state.result.url, kind: "video" as const, label: "תוצאה" };
    }
    if (state.result.url) {
      return { url: state.result.url, kind: "image" as const, label: "תוצאה" };
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
      return { url: state.source.url, kind: "image" as const, label: "מקור" };
    }
    return null;
  }, [state.result, state.preview, state.cutout.url, state.source.url]);

  const canCompare =
    Boolean(state.source.url) &&
    Boolean(current?.url) &&
    current?.url !== state.source.url &&
    current?.kind === "image";

  const displayed =
    showBefore && canCompare
      ? { url: state.source.url!, kind: "image" as const, label: "לפני" }
      : current;

  return (
    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border border-border/60 bg-[repeating-conic-gradient(#f4f4f5_0_25%,#ffffff_0_50%)] bg-[length:24px_24px]">
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
            className="h-full w-full object-contain"
          />
        ) : (
          <Image
            src={displayed.url}
            alt={displayed.label}
            fill
            className="object-contain"
            sizes="(min-width: 1024px) 60vw, 100vw"
            unoptimized
          />
        )
      ) : (
        <p className="px-8 text-center text-sm font-light text-muted-foreground">
          העלו צילום כדי להתחיל — התצוגה תופיע כאן
        </p>
      )}

      {displayed && (
        <span className="absolute right-2 top-2 bg-black/60 px-2 py-0.5 text-[10px] font-light text-white">
          {displayed.label}
        </span>
      )}

      {canCompare && (
        <button
          type="button"
          onPointerDown={() => setShowBefore(true)}
          onPointerUp={() => setShowBefore(false)}
          onPointerLeave={() => setShowBefore(false)}
          className={cn(
            "absolute bottom-2 right-2 border px-3 py-1 text-[11px] font-light backdrop-blur",
            showBefore
              ? "border-gold bg-gold/80 text-black"
              : "border-white/40 bg-black/50 text-white hover:bg-black/70"
          )}
        >
          החזיקו להשוואה עם המקור
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
