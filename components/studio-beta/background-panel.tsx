"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EnginePicker } from "@/components/studio-beta/engine-picker";
import { CompareToggle } from "@/components/studio-beta/compare-toggle";
import { AspectRatioPicker } from "@/components/studio-beta/aspect-ratio-picker";
import { AdjustPanel } from "@/components/studio-beta/adjust-panel";
import { CutoutPanel } from "@/components/studio-beta/cutout-panel";
import { PlacementPanel } from "@/components/studio-beta/placement-panel";
import { SourcePrepPanel } from "@/components/studio-beta/source-prep-panel";
import { IdentifyPanel } from "@/components/studio-beta/identify-panel";
import { AttemptsRail } from "@/components/studio-beta/attempts-rail";
import { selectEffectiveSourceUrl, useStudioBetaStore } from "@/lib/studio-beta/store";
import { areAdjustmentsDefault } from "@/lib/studio-beta/cloudinary-transform";
import {
  BACKGROUND_ENGINES,
  estimateEngineCostUsd,
  getBackgroundEngine,
  type ProvidersConfigured,
} from "@/lib/studio-beta/engines";
import { BACKGROUND_PRESETS } from "@/lib/studio-beta/backgrounds";
import { BACKGROUND_PROMPT_EXAMPLES } from "@/lib/studio-beta/prompt-examples";
import { cn } from "@/lib/utils";

export function BackgroundPanel({
  providers,
}: {
  providers: ProvidersConfigured;
}) {
  const sourceImageUrl = useStudioBetaStore((s) => s.sourceImageUrl);
  const sourceAspect = useStudioBetaStore((s) => s.sourceAspect);
  const sourceAdjustments = useStudioBetaStore((s) => s.sourceAdjustments);
  const setSourceAspect = useStudioBetaStore((s) => s.setSourceAspect);
  const setSourceAdjustment = useStudioBetaStore((s) => s.setSourceAdjustment);
  const setAutoEnhance = useStudioBetaStore((s) => s.setAutoEnhance);
  const resetSourceAdjustments = useStudioBetaStore((s) => s.resetSourceAdjustments);
  const background = useStudioBetaStore((s) => s.background);
  const setBackgroundEngine = useStudioBetaStore((s) => s.setBackgroundEngine);
  const setBackgroundPreset = useStudioBetaStore((s) => s.setBackgroundPreset);
  const setBackgroundCustomPrompt = useStudioBetaStore(
    (s) => s.setBackgroundCustomPrompt
  );
  const runBackground = useStudioBetaStore((s) => s.runBackground);
  const approveBackground = useStudioBetaStore((s) => s.approveBackground);
  const [prepOpen, setPrepOpen] = useState(false);

  if (!sourceImageUrl) return null;
  const loading = background.status === "loading";
  const effectiveSourceUrl = selectEffectiveSourceUrl({
    sourceImageUrl,
    sourceAspect,
    sourceAdjustments,
  })!;
  const hasPrepChanges =
    sourceAspect !== "original" || !areAdjustmentsDefault(sourceAdjustments);
  const selectedEngineDef = getBackgroundEngine(background.engine);

  return (
    <div className="space-y-5">
      <div className="border border-border/60">
        <button
          type="button"
          onClick={() => setPrepOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-light tracking-wide text-muted-foreground hover:text-foreground"
        >
          <span className="flex-1 text-right">
            הכנת התמונה — קרופ וכיוונון{hasPrepChanges ? " (מותאם)" : ""}
          </span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 transition-transform", prepOpen && "rotate-180")}
          />
        </button>
        {prepOpen && (
          <div className="space-y-4 border-t border-border/60 p-3">
            <CompareToggle
              originalUrl={sourceImageUrl}
              resultUrl={effectiveSourceUrl}
              alt="תצוגה מקדימה של הכנת התמונה"
            />
            <div>
              <p className="mb-1.5 text-[11px] font-light text-muted-foreground">
                יחס תמונה
              </p>
              <AspectRatioPicker value={sourceAspect} onChange={setSourceAspect} />
            </div>
            <AdjustPanel
              value={sourceAdjustments}
              onChange={setSourceAdjustment}
              onAutoEnhanceChange={setAutoEnhance}
              onReset={resetSourceAdjustments}
            />
            <div className="border-t border-border/60 pt-3">
              <SourcePrepPanel />
            </div>
            <div className="border-t border-border/60 pt-3">
              <IdentifyPanel />
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-light tracking-wide text-muted-foreground">
          בחרו רקע מהבנק, או תארו רקע מותאם אישית
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {BACKGROUND_PRESETS.map((preset) => {
            const selected =
              background.presetId === preset.id && !background.customPrompt;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setBackgroundPreset(preset.id);
                  setBackgroundCustomPrompt("");
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 border p-1.5 transition-colors",
                  selected
                    ? "border-gold"
                    : "border-border/60 hover:border-gold/60"
                )}
              >
                <span
                  className="relative block h-10 w-full bg-cover bg-center"
                  style={{
                    backgroundColor: preset.swatch,
                    backgroundImage: preset.previewUrl
                      ? `url(${preset.previewUrl})`
                      : undefined,
                  }}
                  aria-hidden
                >
                  {preset.previewUrl && (
                    <a
                      href={preset.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      title="פתח תמונת רקע מלאה"
                      className="absolute left-0.5 top-0.5 flex h-4 w-4 items-center justify-center bg-background/80 text-foreground/80 hover:text-gold"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </span>
                <span className="text-[11px] font-light">{preset.label}</span>
              </button>
            );
          })}
        </div>
        <Textarea
          value={background.customPrompt}
          onChange={(event) => setBackgroundCustomPrompt(event.target.value)}
          placeholder="לתיאור רקע מותאם אישית — לדוגמה: רקע אבן ירושלמית בזריחה"
          className="mt-2 rounded-none text-sm"
          rows={2}
        />
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {BACKGROUND_PROMPT_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setBackgroundCustomPrompt(example)}
              className="border border-border/60 px-2 py-1 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-light tracking-wide text-muted-foreground">
          מנוע יצירת הרקע
        </p>
        <EnginePicker
          engines={BACKGROUND_ENGINES}
          estimateCost={estimateEngineCostUsd}
          value={background.engine}
          onChange={(id) => setBackgroundEngine(id as typeof background.engine)}
          providers={providers}
        />
      </div>

      {selectedEngineDef?.usesCutout && (
        <CutoutPanel sourceImageUrl={effectiveSourceUrl} />
      )}

      {selectedEngineDef?.usesCutout && <PlacementPanel />}

      <Button
        type="button"
        onClick={runBackground}
        disabled={loading}
        className="w-full rounded-none text-xs tracking-[0.1em]"
      >
        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        {background.status === "done" ? "צור רקע מחדש" : "צור רקע"}
      </Button>
      {selectedEngineDef?.usesCutout &&
        background.status === "idle" && (
          <p className="-mt-3 text-[11px] font-light text-muted-foreground">
            הבידוד הידני אופציונלי — אם לא תאשרו אותו, ייעשה בידוד אוטומטי כרגיל.
          </p>
        )}

      {background.error && (
        <p className="text-xs font-light text-destructive">
          {background.error}
        </p>
      )}

      {background.url && (
        <div className="space-y-2 border border-border/60 p-2">
          <CompareToggle
            originalUrl={sourceImageUrl}
            resultUrl={background.url}
            alt="תוצאת הרכבת הרקע"
          />
          {background.fallbackNote && (
            <p className="text-[11px] font-light text-muted-foreground">
              {background.fallbackNote}
            </p>
          )}
          <Button
            type="button"
            onClick={approveBackground}
            className="w-full rounded-none text-xs tracking-[0.1em]"
          >
            אישור והמשך
          </Button>
        </div>
      )}

      <AttemptsRail kind="background" />
    </div>
  );
}
