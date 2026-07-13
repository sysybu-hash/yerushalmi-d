"use client";

import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import { getBackgroundPreset } from "@/lib/studio-beta/backgrounds";

const OFFSET_LIMIT = 0.25;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * גרירה ושינוי גודל של התכשיט על הרקע — נוסחת המיקום כאן מקבילה 1:1
 * לנוסחה בשרת (lib/studio-beta/composite.ts) כדי שהתצוגה המקדימה תהיה
 * מדויקת למה שיתקבל בפועל.
 */
export function PlacementPanel() {
  const cutoutUrl = useStudioBetaStore((s) => s.cutout.url);
  const background = useStudioBetaStore((s) => s.background);
  const setBackgroundPlacement = useStudioBetaStore(
    (s) => s.setBackgroundPlacement
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  if (!cutoutUrl) return null;

  const preset =
    background.engine === "procedural" && background.presetId
      ? getBackgroundPreset(background.presetId)
      : undefined;
  const { scale, offsetX, offsetY } = background.placement;

  const onPointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!dragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (event.clientX - dragRef.current.startX) / rect.width;
    const dy = (event.clientY - dragRef.current.startY) / rect.height;
    setBackgroundPlacement({
      offsetX: clamp(dragRef.current.startOffsetX + dx, -OFFSET_LIMIT, OFFSET_LIMIT),
      offsetY: clamp(dragRef.current.startOffsetY + dy, -OFFSET_LIMIT, OFFSET_LIMIT),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-light tracking-wide text-muted-foreground">
        מיקום וגודל — גררו את התכשיט או השתמשו בסליידר
      </p>
      <div
        ref={containerRef}
        className="relative aspect-square w-full max-w-xs overflow-hidden border border-border/60 bg-cover bg-center"
        style={{
          backgroundColor: preset?.swatch ?? "#EDE7DC",
          backgroundImage: preset?.previewUrl ? `url(${preset.previewUrl})` : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cutoutUrl}
          alt="מיקום התכשיט"
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="absolute cursor-move touch-none select-none"
          style={{
            left: `${50 + offsetX * 100}%`,
            top: `${58 + offsetY * 100}%`,
            maxWidth: `${70 * scale}%`,
            maxHeight: `${70 * scale}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0.6}
          max={1.3}
          step={0.01}
          value={scale}
          onChange={(event) =>
            setBackgroundPlacement({ scale: Number(event.target.value) })
          }
          className="flex-1 accent-gold"
        />
        <button
          type="button"
          onClick={() =>
            setBackgroundPlacement({ scale: 1, offsetX: 0, offsetY: 0 })
          }
          className="flex items-center gap-1 border border-border/60 px-2 py-1 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          איפוס מיקום
        </button>
      </div>
    </div>
  );
}
