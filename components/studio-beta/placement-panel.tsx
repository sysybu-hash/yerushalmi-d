"use client";

import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import { getBackgroundPreset } from "@/lib/studio-beta/backgrounds";
import { cn } from "@/lib/utils";

const OFFSET_LIMIT = 0.25;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * גרירה ושינוי גודל של התכשיט ושל הרקע עצמו — נוסחאות המיקום כאן
 * מקבילות 1:1 לנוסחאות בשרת (lib/studio-beta/composite.ts) כדי שהתצוגה
 * המקדימה תהיה מדויקת למה שיתקבל בפועל. גרירה על התכשיט מזיזה אותו;
 * גרירה על שאר שטח הרקע מזיזה את הרקע (stopPropagation על התכשיט מונע
 * "דליפה" של גרירה אחת לשנייה).
 */
export function PlacementPanel() {
  const cutoutUrl = useStudioBetaStore((s) => s.cutout.url);
  const background = useStudioBetaStore((s) => s.background);
  const setBackgroundPlacement = useStudioBetaStore(
    (s) => s.setBackgroundPlacement
  );
  const setBackdropPlacement = useStudioBetaStore(
    (s) => s.setBackdropPlacement
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const backdropDragRef = useRef<{
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
  const {
    scale: bgScale,
    offsetX: bgOffsetX,
    offsetY: bgOffsetY,
  } = background.backdropPlacement;

  const onPointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    event.stopPropagation();
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

  const onBackdropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (bgScale <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    backdropDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: bgOffsetX,
      startOffsetY: bgOffsetY,
    };
  };

  const onBackdropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!backdropDragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (event.clientX - backdropDragRef.current.startX) / rect.width;
    const dy = (event.clientY - backdropDragRef.current.startY) / rect.height;
    const room = Math.max(0.01, bgScale - 1);
    setBackdropPlacement({
      offsetX: clamp(backdropDragRef.current.startOffsetX - dx / room, 0, 1),
      offsetY: clamp(backdropDragRef.current.startOffsetY - dy / room, 0, 1),
    });
  };

  const onBackdropPointerUp = () => {
    backdropDragRef.current = null;
  };

  // ממקם את שכבת הרקע כך שתואם 1:1 לנוסחת החיתוך בשרת (composite.ts:prepareBackdrop) —
  // offsetX/offsetY הם 0..1 כמו background-position ב-CSS (0.5 = מרכז)
  const backdropLeft = -100 * bgOffsetX * (bgScale - 1);
  const backdropTop = -100 * bgOffsetY * (bgScale - 1);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-light tracking-wide text-muted-foreground">
          מיקום וגודל — גררו את התכשיט או את הרקע, השתמשו בסליידרים
        </p>
        <div
          ref={containerRef}
          className="relative aspect-square w-full max-w-xs touch-none overflow-hidden border border-border/60"
          style={{ backgroundColor: preset?.swatch ?? "#EDE7DC" }}
          onPointerDown={onBackdropPointerDown}
          onPointerMove={onBackdropPointerMove}
          onPointerUp={onBackdropPointerUp}
        >
          {preset?.previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preset.previewUrl}
              alt="תצוגת רקע"
              draggable={false}
              className={cn("absolute select-none", bgScale > 1 && "cursor-move")}
              style={{
                left: `${backdropLeft}%`,
                top: `${backdropTop}%`,
                width: `${bgScale * 100}%`,
                height: `${bgScale * 100}%`,
                maxWidth: "none",
                maxHeight: "none",
              }}
            />
          )}
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
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-light text-muted-foreground">
          גודל התכשיט
        </p>
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
            איפוס
          </button>
        </div>
      </div>

      {preset?.previewUrl && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-light text-muted-foreground">
            זום רקע
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={2}
              step={0.01}
              value={bgScale}
              onChange={(event) =>
                setBackdropPlacement({ scale: Number(event.target.value) })
              }
              className="flex-1 accent-gold"
            />
            <button
              type="button"
              onClick={() =>
                setBackdropPlacement({ scale: 1, offsetX: 0.5, offsetY: 0.5 })
              }
              className="flex items-center gap-1 border border-border/60 px-2 py-1 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              איפוס
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
