"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EnginePicker } from "@/components/studio-beta/engine-picker";
import { CompareToggle } from "@/components/studio-beta/compare-toggle";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import {
  BACKGROUND_ENGINES,
  estimateEngineCostUsd,
  type ProvidersConfigured,
} from "@/lib/studio-beta/engines";
import { BACKGROUND_PRESETS } from "@/lib/studio-beta/backgrounds";
import { cn } from "@/lib/utils";

export function BackgroundPanel({
  providers,
}: {
  providers: ProvidersConfigured;
}) {
  const sourceImageUrl = useStudioBetaStore((s) => s.sourceImageUrl);
  const background = useStudioBetaStore((s) => s.background);
  const setBackgroundEngine = useStudioBetaStore((s) => s.setBackgroundEngine);
  const setBackgroundPreset = useStudioBetaStore((s) => s.setBackgroundPreset);
  const setBackgroundCustomPrompt = useStudioBetaStore(
    (s) => s.setBackgroundCustomPrompt
  );
  const runBackground = useStudioBetaStore((s) => s.runBackground);
  const approveBackground = useStudioBetaStore((s) => s.approveBackground);

  if (!sourceImageUrl) return null;
  const loading = background.status === "loading";

  return (
    <div className="space-y-5">
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
                  className="h-10 w-full"
                  style={{ backgroundColor: preset.swatch }}
                  aria-hidden
                />
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

      <Button
        type="button"
        onClick={runBackground}
        disabled={loading}
        className="w-full rounded-none text-xs tracking-[0.1em]"
      >
        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        {background.status === "done" ? "צור רקע מחדש" : "צור רקע"}
      </Button>

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
    </div>
  );
}
