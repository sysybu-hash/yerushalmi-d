"use client";

import * as React from "react";
import { Loader2, RotateCcw, Video, Wand2 } from "lucide-react";

import { saveAssetToCloudinary } from "@/app/(ai-studio)/studio/actions";
import { StudioAiEnhancePanel } from "@/components/studio/studio-ai-enhance-panel";
import {
  AdjustSlider,
  ToggleChip,
} from "@/components/studio/studio-adjust-ui";
import { StudioVideoAudioPanel } from "@/components/studio/studio-video-audio-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MediaPreviewTrigger } from "@/components/ui/media-preview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { StudioPipelineMode } from "@/lib/ai-engines";
import type { StudioStylePresetId } from "@/lib/studio-presets";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";
import {
  ASPECT_OPTIONS,
  DEFAULT_VIDEO_ADJUSTMENTS,
  JEWELRY_CATALOG_VIDEO_ADJUSTMENTS,
  buildTransformedUrl,
  hasVideoEdits,
  type AspectId,
  type VideoAdjustments,
} from "@/lib/studio-transform";

type StudioVideoPrepProps = {
  videoUrl: string;
  duration?: number | null;
  adjustments: VideoAdjustments;
  onAdjustmentsChange: (adj: VideoAdjustments) => void;
  onVideoUpdated: (url: string) => void;
  showToast: (message: string) => void;
  studioMode?: StudioPipelineMode;
  projectId?: number | null;
  disabled?: boolean;
  title?: string;
  videoDuration?: StudioVideoDurationSec;
  stylePreset?: StudioStylePresetId;
};

export function StudioVideoPrep({
  videoUrl,
  duration,
  adjustments,
  onAdjustmentsChange,
  onVideoUpdated,
  showToast,
  studioMode = "catalog",
  projectId,
  disabled,
  title = "מיטוב וידאו",
  videoDuration = 5,
  stylePreset = "luxury-marble",
}: StudioVideoPrepProps) {
  const [busy, setBusy] = React.useState(false);

  const previewUrl = React.useMemo(
    () => buildTransformedUrl(videoUrl, "video", adjustments, { quality: "best" }),
    [videoUrl, adjustments]
  );

  const edited = hasVideoEdits(adjustments);

  function patchAdj(patch: Partial<VideoAdjustments>) {
    onAdjustmentsChange({ ...adjustments, ...patch });
  }

  async function handleApply() {
    setBusy(true);
    try {
      const saveUrl = buildTransformedUrl(videoUrl, "video", adjustments, {
        quality: "best",
      });
      const { url } = await saveAssetToCloudinary(saveUrl, "video");
      onVideoUpdated(url);
      onAdjustmentsChange(DEFAULT_VIDEO_ADJUSTMENTS);
      showToast("הווידאו המעובד נשמר");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "שמירת הווידאו נכשלה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="rounded-none border-gold/25 bg-gold/[0.03] shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-light tracking-[0.1em] text-gold-dark">
          <Video aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-light">יחס / חיתוך</Label>
              <Select
                dir="rtl"
                value={adjustments.aspect}
                onValueChange={(v) => patchAdj({ aspect: v as AspectId })}
                disabled={disabled || busy}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <ToggleChip
                label="פריסט קטלוג"
                active={
                  adjustments.audioStyle === "luxury" &&
                  adjustments.autoEnhance &&
                  adjustments.sharpen
                }
                disabled={disabled || busy}
                onClick={() =>
                  onAdjustmentsChange(JEWELRY_CATALOG_VIDEO_ADJUSTMENTS)
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <ToggleChip
                label="שיפור אוטומטי"
                active={adjustments.autoEnhance}
                disabled={disabled || busy}
                onClick={() =>
                  patchAdj({ autoEnhance: !adjustments.autoEnhance })
                }
              />
              <ToggleChip
                label="איזון צבע"
                active={adjustments.autoColor}
                disabled={disabled || busy}
                onClick={() => patchAdj({ autoColor: !adjustments.autoColor })}
              />
              <ToggleChip
                label="חידוד"
                active={adjustments.sharpen}
                disabled={disabled || busy}
                onClick={() => patchAdj({ sharpen: !adjustments.sharpen })}
              />
              <ToggleChip
                label="הפחתת רעש"
                active={adjustments.denoise}
                disabled={disabled || busy}
                onClick={() => patchAdj({ denoise: !adjustments.denoise })}
              />
            </div>

            <div className="space-y-4">
              <AdjustSlider
                label="בהירות"
                value={adjustments.brightness}
                disabled={disabled || busy}
                onChange={(v) => patchAdj({ brightness: v })}
              />
              <AdjustSlider
                label="רוויה"
                value={adjustments.saturation}
                disabled={disabled || busy}
                onChange={(v) => patchAdj({ saturation: v })}
              />
              <AdjustSlider
                label="ניגודיות"
                value={adjustments.contrast}
                disabled={disabled || busy}
                onChange={(v) => patchAdj({ contrast: v })}
              />
            </div>

            <StudioVideoAudioPanel
              adjustments={adjustments}
              onChange={onAdjustmentsChange}
              disabled={disabled || busy}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={disabled || busy || !edited}
                onClick={() => void handleApply()}
                className="rounded-none text-xs font-light"
              >
                {busy ? (
                  <Loader2 aria-hidden className="ml-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 aria-hidden className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                )}
                החלת מיטוב ושמירה
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || busy || !edited}
                onClick={() => onAdjustmentsChange(DEFAULT_VIDEO_ADJUSTMENTS)}
                className="rounded-none text-xs font-light text-muted-foreground"
              >
                <RotateCcw aria-hidden className="ml-1.5 h-3.5 w-3.5" />
                איפוס
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-light">תצוגה מקדימה {edited ? "· נערך" : ""}</Label>
            {duration != null && (
              <p className="text-[11px] font-light text-muted-foreground">
                אורך: {duration.toFixed(1)} שניות
              </p>
            )}
            <div className="relative aspect-video overflow-hidden border border-border/60 bg-stone-900">
              {previewUrl && (
                <MediaPreviewTrigger
                  url={previewUrl}
                  type="video"
                  alt="תצוגה מקדימה של הווידאו"
                  className="absolute inset-0 block h-full w-full"
                >
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    key={previewUrl}
                    src={previewUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="pointer-events-none h-full w-full object-contain"
                  />
                </MediaPreviewTrigger>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-border/40" />

        <StudioAiEnhancePanel
          mediaType="video"
          sourceUrl={videoUrl}
          onEnhanced={onVideoUpdated}
          showToast={showToast}
          studioMode={studioMode}
          projectId={projectId}
          disabled={disabled || busy}
          videoDuration={videoDuration}
          stylePreset={stylePreset}
        />
      </CardContent>
    </Card>
  );
}
