"use client";

import type { AiBackgroundProvider } from "@/lib/ai-engines";
import { AI_BACKGROUND_OPTIONS } from "@/lib/ai-engines";
import { aiBackgroundProviderLabel } from "@/lib/studio-engine-ui";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudioCostChip, STUDIO_COST_LABELS } from "./studio-cost-chip";
import { StudioSection } from "./studio-section";

const AI_BG_CHOICES = AI_BACKGROUND_OPTIONS.filter(
  (o) => o.value !== "procedural"
);

/**
 * בחירת מנוע הרכבת הרקע — מקור אמת יחיד בקטלוג.
 * פרוצדורלי (חינם) מול AI גנרטיבי + בחירת ספק AI כשצריך.
 */
export function StudioBackgroundEngineChoice({
  useAiBackground,
  backgroundProvider,
  highQualityBackground,
  onUseAiBackgroundChange,
  onBackgroundProviderChange,
  onHighQualityBackgroundChange,
  disabled,
}: {
  useAiBackground: boolean;
  backgroundProvider: AiBackgroundProvider;
  highQualityBackground: boolean;
  onUseAiBackgroundChange: (value: boolean) => void;
  onBackgroundProviderChange: (value: AiBackgroundProvider) => void;
  onHighQualityBackgroundChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const activeLabel = aiBackgroundProviderLabel(
    backgroundProvider,
    useAiBackground
  );

  return (
    <StudioSection title="הרכבת רקע">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUseAiBackgroundChange(false)}
            className={cn(
              "flex flex-col items-center gap-1 border px-2 py-2 text-xs font-light transition-colors disabled:opacity-50",
              !useAiBackground
                ? "border-gold bg-gold/10"
                : "border-border/60 hover:border-gold/40"
            )}
          >
            <span>פרוצדורלי (Sharp)</span>
            <StudioCostChip free />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUseAiBackgroundChange(true)}
            className={cn(
              "flex flex-col items-center gap-1 border px-2 py-2 text-xs font-light transition-colors disabled:opacity-50",
              useAiBackground
                ? "border-gold bg-gold/10"
                : "border-border/60 hover:border-gold/40"
            )}
          >
            <span>רקע AI גנרטיבי</span>
            <StudioCostChip label={STUDIO_COST_LABELS.aiBackground} />
          </button>
        </div>

        <p className="text-[10px] font-light text-muted-foreground">
          פעיל: {activeLabel}
        </p>

        {useAiBackground && (
          <div className="space-y-2 border-t border-border/40 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-light text-muted-foreground">
                מנוע רקע AI
              </Label>
              <Select
                dir="rtl"
                value={
                  backgroundProvider === "procedural"
                    ? "auto"
                    : backgroundProvider
                }
                onValueChange={(next) =>
                  onBackgroundProviderChange(next as AiBackgroundProvider)
                }
                disabled={disabled}
              >
                <SelectTrigger className="rounded-none bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_BG_CHOICES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center justify-between gap-2 text-xs font-light">
              <span>איכות גבוהה (SDXL — איטי יותר)</span>
              <input
                type="checkbox"
                checked={highQualityBackground}
                disabled={disabled}
                onChange={(e) => onHighQualityBackgroundChange(e.target.checked)}
                className="h-4 w-4 accent-[#c9a961]"
              />
            </label>
          </div>
        )}

        {useAiBackground && (
          <p className="text-[10px] font-light text-muted-foreground">
            רקע AI ייווצר ישירות בלחיצה על &quot;יצירת תמונה&quot; בשלב 3.
          </p>
        )}
      </div>
    </StudioSection>
  );
}
