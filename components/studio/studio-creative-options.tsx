"use client";

import type {
  AiEngineConfig,
  StudioPipelineMode,
} from "@/lib/ai-engines";
import { AiEngineSelector } from "@/components/studio/ai-engine-selector";
import { StylePresetGrid } from "@/components/studio/style-preset-grid";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  STUDIO_PROMPT_EXAMPLES,
  STUDIO_STYLE_PRESETS,
  STUDIO_VIDEO_PROMPT_EXAMPLES,
  type StudioStylePresetId,
} from "@/lib/studio-presets";
import {
  STUDIO_VIDEO_DURATION_OPTIONS,
  type StudioVideoDurationSec,
} from "@/lib/studio-video-duration";
import type { StudioVideoMotionMode } from "@/lib/studio-types";

type StudioCreativeOptionsProps = {
  studioMode: StudioPipelineMode;
  onStudioModeChange: (mode: StudioPipelineMode) => void;
  stylePreset: StudioStylePresetId;
  onStylePresetChange: (preset: StudioStylePresetId) => void;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
  aiEngines: AiEngineConfig;
  onAiEnginesChange: (engines: AiEngineConfig) => void;
  useAiBackground: boolean;
  onUseAiBackgroundChange: (value: boolean) => void;
  highQualityBackground: boolean;
  onHighQualityBackgroundChange: (value: boolean) => void;
  videoDuration?: StudioVideoDurationSec;
  onVideoDurationChange?: (duration: StudioVideoDurationSec) => void;
  videoMode?: "standard" | "pro";
  onVideoModeChange?: (mode: "standard" | "pro") => void;
  videoMotionMode?: StudioVideoMotionMode;
  onVideoMotionModeChange?: (mode: StudioVideoMotionMode) => void;
  videoPrompt?: string;
  onVideoPromptChange?: (value: string) => void;
  negativePrompt?: string;
  onNegativePromptChange?: (value: string) => void;
  showVideoSettings?: boolean;
  showModeToggle?: boolean;
  disabled?: boolean;
};

export function StudioCreativeOptionsPanel({
  studioMode,
  onStudioModeChange,
  stylePreset,
  onStylePresetChange,
  customPrompt,
  onCustomPromptChange,
  aiEngines,
  onAiEnginesChange,
  useAiBackground,
  onUseAiBackgroundChange,
  highQualityBackground,
  onHighQualityBackgroundChange,
  videoDuration = 5,
  onVideoDurationChange,
  videoMode = "pro",
  onVideoModeChange,
  videoMotionMode = "preserve",
  onVideoMotionModeChange,
  videoPrompt = "",
  onVideoPromptChange,
  negativePrompt = "",
  onNegativePromptChange,
  showVideoSettings = false,
  showModeToggle = true,
  disabled,
}: StudioCreativeOptionsProps) {
  const durationHint = STUDIO_VIDEO_DURATION_OPTIONS.find(
    (o) => o.value === videoDuration
  )?.hint;

  return (
    <div className="space-y-5">
      {showModeToggle && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={studioMode === "catalog"}
            disabled={disabled}
            onClick={() => {
              onStudioModeChange("catalog");
              onUseAiBackgroundChange(false);
            }}
            className={`border px-4 py-2 text-xs font-light tracking-[0.1em] transition-colors disabled:opacity-40 ${
              studioMode === "catalog"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                : "border-border/60 text-muted-foreground hover:border-emerald-400"
            }`}
          >
            מצב קטלוג — 1 קריאת API
          </button>
          <button
            type="button"
            aria-pressed={studioMode === "marketing"}
            disabled={disabled}
            onClick={() => onStudioModeChange("marketing")}
            className={`border px-4 py-2 text-xs font-light tracking-[0.1em] transition-colors disabled:opacity-40 ${
              studioMode === "marketing"
                ? "border-gold bg-gold/15 text-gold-dark"
                : "border-border/60 text-muted-foreground hover:border-gold/50"
            }`}
          >
            מצב שיווק — AI רקע / וידאו
          </button>
        </div>
      )}

      <div className="rounded-none border border-emerald-200/80 bg-emerald-50/50 px-3 py-2 text-[11px] font-light leading-relaxed text-emerald-900">
        התכשיט נשמר מהמקור — AI משנה רקע ותאורה, לא את עיצוב התכשיט.
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <Label className="font-light">סגנון רקע</Label>
          <span className="text-[10px] font-light tracking-[0.08em] text-muted-foreground">
            {STUDIO_STYLE_PRESETS.length} סגנונות
          </span>
        </div>
        <StylePresetGrid
          value={stylePreset}
          onChange={onStylePresetChange}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="creative-custom-prompt" className="font-light">
          תאורה ואווירה (אופציונלי)
        </Label>
        <Textarea
          id="creative-custom-prompt"
          value={customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          rows={3}
          disabled={disabled}
          placeholder="לדוגמה: תאורה דרמטית, השתקפויות זהב, רקע כהה..."
          className="rounded-none resize-none"
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {STUDIO_PROMPT_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={disabled}
              onClick={() => onCustomPromptChange(example)}
              className="border border-border/60 px-2 py-1 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {showVideoSettings && onVideoMotionModeChange && (
        <>
          <Separator className="bg-border/40" />
          <div className="space-y-3">
            <Label className="text-xs font-light text-muted-foreground">
              סוג וידאו
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={videoMotionMode === "preserve"}
                disabled={disabled}
                onClick={() => onVideoMotionModeChange("preserve")}
                className={`border px-3 py-2 text-[11px] font-light tracking-[0.08em] transition-colors disabled:opacity-40 ${
                  videoMotionMode === "preserve"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-border/60 text-muted-foreground hover:border-emerald-400"
                }`}
              >
                קטלוג — זום עדין (מומלץ)
              </button>
              <button
                type="button"
                aria-pressed={videoMotionMode === "ai"}
                disabled={disabled}
                onClick={() => onVideoMotionModeChange("ai")}
                className={`border px-3 py-2 text-[11px] font-light tracking-[0.08em] transition-colors disabled:opacity-40 ${
                  videoMotionMode === "ai"
                    ? "border-gold bg-gold/15 text-gold-dark"
                    : "border-border/60 text-muted-foreground hover:border-gold/50"
                }`}
              >
                AI — Veo / Kling (+API)
              </button>
            </div>
            <p className="text-[10px] font-light leading-relaxed text-muted-foreground">
              {videoMotionMode === "preserve"
                ? "תנועת זום עדינה מהתמונה — שומרת על התכשיט בדיוק, ללא מורפינג."
                : "וידאו גנרטיבי — מתאים לשיווק; דורש קרדיטים ב-Gemini או Replicate."}
            </p>
          </div>
        </>
      )}

      {showVideoSettings && onVideoDurationChange && onVideoModeChange && (
        <>
          <Separator className="bg-border/40" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-light text-muted-foreground">
                אורך הווידאו
              </Label>
              <Select
                dir="rtl"
                value={String(videoDuration)}
                onValueChange={(v) =>
                  onVideoDurationChange(Number(v) as StudioVideoDurationSec)
                }
                disabled={disabled}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDIO_VIDEO_DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {durationHint && (
                <p className="text-[10px] font-light text-muted-foreground">
                  {durationHint}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-light text-muted-foreground">
                איכות וידאו
              </Label>
              <Select
                dir="rtl"
                value={videoMode}
                onValueChange={(v) =>
                  onVideoModeChange(v as "standard" | "pro")
                }
                disabled={disabled}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (720p)</SelectItem>
                  <SelectItem value="pro">Pro (1080p)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {videoMotionMode === "ai" && onVideoPromptChange && (
            <div className="space-y-2">
              <Label className="text-xs font-light text-muted-foreground">
                תנועה לווידאו (אופציונלי)
              </Label>
              <Textarea
                value={videoPrompt}
                onChange={(e) => onVideoPromptChange(e.target.value)}
                rows={2}
                disabled={disabled}
                placeholder="סיבוב איטי, נצנוץ יהלומים..."
                className="rounded-none resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {STUDIO_VIDEO_PROMPT_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={disabled}
                    onClick={() => onVideoPromptChange(example)}
                    className="border border-border/60 px-2 py-1 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
          {videoMotionMode === "ai" && onNegativePromptChange && (
            <div className="space-y-2">
              <Label className="text-xs font-light text-muted-foreground">
                מה להימנע בווידאו (אופציונלי)
              </Label>
              <Textarea
                value={negativePrompt}
                onChange={(e) => onNegativePromptChange(e.target.value)}
                rows={2}
                disabled={disabled}
                placeholder="שינוי צורת התכשיט, תנועת מצלמה..."
                className="rounded-none resize-none"
              />
            </div>
          )}
        </>
      )}

      <Separator className="bg-border/40" />

      <details className="rounded-none border border-border/40 bg-muted/20 px-3 py-2">
        <summary className="cursor-pointer text-xs font-light tracking-[0.08em] text-muted-foreground">
          מנועי AI — אוטומטי / Replicate / Gemini
        </summary>
        <div className="mt-4">
          <AiEngineSelector
            value={aiEngines}
            onChange={onAiEnginesChange}
            disabled={disabled}
            compact
            showBackground={studioMode === "marketing"}
          />
        </div>
      </details>

      {studioMode === "marketing" && (
        <div className="space-y-3 rounded-none border border-amber-200/80 bg-amber-50/40 p-3">
          <label className="flex items-center gap-2 text-xs font-light">
            <input
              type="checkbox"
              checked={useAiBackground}
              onChange={(e) => onUseAiBackgroundChange(e.target.checked)}
              disabled={disabled}
            />
            רקע AI (+1 קריאת API)
          </label>
          {useAiBackground && (
            <label className="flex items-center gap-2 text-xs font-light">
              <input
                type="checkbox"
                checked={highQualityBackground}
                onChange={(e) => onHighQualityBackgroundChange(e.target.checked)}
                disabled={disabled}
              />
              איכות גבוהה (SDXL) — יקר יותר
            </label>
          )}
        </div>
      )}

      {studioMode === "catalog" && (
        <p className="text-[11px] font-light text-emerald-800">
          קטלוג: Gemini cutout + רקע פרוצדורלי + צל — ללא Replicate.
        </p>
      )}
    </div>
  );
}
