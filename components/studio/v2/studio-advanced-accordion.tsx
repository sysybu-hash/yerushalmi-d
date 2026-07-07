"use client";

import { ChevronDown, Settings2 } from "lucide-react";

import type { AiEngineConfig } from "@/lib/ai-engines";
import type { StudioV2State } from "@/lib/studio-client/state";
import type { StudioAction } from "@/lib/studio-client/reducer";
import { AiEngineSelector } from "@/components/studio/ai-engine-selector";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { STUDIO_PROMPT_EXAMPLES } from "@/lib/studio-presets";
import { cn } from "@/lib/utils";
import { StudioCostChip, STUDIO_COST_LABELS } from "./studio-cost-chip";

/**
 * הגדרות מתקדמות — סגור כברירת מחדל. ברירת המחדל של הכול היא "אוטומטי":
 * מי שלא פותח את זה מקבל את המסלול הפשוט והזול.
 */
export function StudioAdvancedAccordion({
  state,
  dispatch,
  disabled,
}: {
  state: StudioV2State;
  dispatch: React.Dispatch<StudioAction>;
  disabled?: boolean;
}) {
  return (
    <div className="border border-border/60">
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "SET_ADVANCED_OPEN", open: !state.advancedOpen })
        }
        className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-light tracking-[0.1em] text-muted-foreground hover:bg-muted/40"
      >
        <span className="flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5" />
          הגדרות מתקדמות
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            state.advancedOpen && "rotate-180"
          )}
        />
      </button>

      {state.advancedOpen && (
        <div className="space-y-4 border-t border-border/60 p-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-light text-muted-foreground">
              הנחיה מותאמת (עברית — מתורגמת אוטומטית)
            </Label>
            <Textarea
              dir="rtl"
              rows={2}
              value={state.customPrompt}
              disabled={disabled}
              onChange={(e) =>
                dispatch({ type: "SET_CUSTOM_PROMPT", value: e.target.value })
              }
              placeholder={STUDIO_PROMPT_EXAMPLES[0]}
              className="rounded-none text-sm font-light"
            />
          </div>

          {state.flow === "marketing" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-light text-muted-foreground">
                הנחיית וידאו
              </Label>
              <Textarea
                dir="rtl"
                rows={2}
                value={state.videoPrompt}
                disabled={disabled}
                onChange={(e) =>
                  dispatch({ type: "SET_VIDEO_PROMPT", value: e.target.value })
                }
                placeholder="מצלמה קבועה, נצנוץ עדין על היהלומים בלבד"
                className="rounded-none text-sm font-light"
              />
            </div>
          )}

          <label className="flex items-center justify-between gap-2 text-xs font-light">
            <span className="flex items-center gap-2">
              רקע AI גנרטיבי
              <StudioCostChip label={STUDIO_COST_LABELS.aiBackground} />
            </span>
            <input
              type="checkbox"
              checked={state.useAiBackground}
              disabled={disabled}
              onChange={(e) =>
                dispatch({
                  type: "SET_USE_AI_BACKGROUND",
                  value: e.target.checked,
                })
              }
              className="h-4 w-4 accent-[#c9a961]"
            />
          </label>

          {state.useAiBackground && (
            <label className="flex items-center justify-between gap-2 text-xs font-light">
              <span>איכות רקע גבוהה (SDXL — איטי ויקר יותר)</span>
              <input
                type="checkbox"
                checked={state.highQualityBackground}
                disabled={disabled}
                onChange={(e) =>
                  dispatch({
                    type: "SET_HIGH_QUALITY_BACKGROUND",
                    value: e.target.checked,
                  })
                }
                className="h-4 w-4 accent-[#c9a961]"
              />
            </label>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-light tracking-[0.1em] text-muted-foreground">
              מנועי AI (ברירת מחדל: אוטומטי)
            </p>
            <AiEngineSelector
              value={state.aiEngines}
              onChange={(engines: AiEngineConfig) =>
                dispatch({ type: "SET_ENGINES", engines })
              }
              capabilities={["cutout", "video"]}
              showBackground
              compact
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
