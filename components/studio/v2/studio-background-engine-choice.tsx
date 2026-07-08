"use client";

import { cn } from "@/lib/utils";
import { StudioCostChip, STUDIO_COST_LABELS } from "./studio-cost-chip";

/**
 * בחירת מנוע הרכבת הרקע — גלוי תמיד בזרימה הראשית, לא בתוך "הגדרות
 * מתקדמות". חינם (הרכבה פרוצדורלית) מול AI גנרטיבי (Flux/SDXL) הן שתי
 * דרכים אמיתיות ושוות-ערך להשיג את אותה תוצאה — המשתמש בוחר, לא המערכת.
 */
export function StudioBackgroundEngineChoice({
  useAiBackground,
  highQualityBackground,
  onUseAiBackgroundChange,
  onHighQualityBackgroundChange,
  disabled,
}: {
  useAiBackground: boolean;
  highQualityBackground: boolean;
  onUseAiBackgroundChange: (value: boolean) => void;
  onHighQualityBackgroundChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-light tracking-[0.1em] text-muted-foreground">
        מנוע הרכבת הרקע
      </p>
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
          <span>הרכבה פרוצדורלית (Cloudinary)</span>
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
          <span>רקע AI גנרטיבי (Flux/SDXL)</span>
          <StudioCostChip label={STUDIO_COST_LABELS.aiBackground} />
        </button>
      </div>

      {useAiBackground && (
        <label className="flex items-center justify-between gap-2 pt-1 text-xs font-light">
          <span>איכות רקע גבוהה (SDXL — איטי ויקר יותר)</span>
          <input
            type="checkbox"
            checked={highQualityBackground}
            disabled={disabled}
            onChange={(e) => onHighQualityBackgroundChange(e.target.checked)}
            className="h-4 w-4 accent-[#c9a961]"
          />
        </label>
      )}
    </div>
  );
}
