"use client";

import type { AiCapability, AiEngineConfig, AiEngineProvider } from "@/lib/ai-engines";
import {
  AI_CAPABILITY_LABELS,
  DEFAULT_AI_ENGINES,
  engineOptionsForCapability,
} from "@/lib/ai-engines";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AiEngineSelectorProps = {
  value: AiEngineConfig;
  onChange: (next: AiEngineConfig) => void;
  capabilities?: AiCapability[];
  disabled?: boolean;
  compact?: boolean;
};

export function AiEngineSelector({
  value,
  onChange,
  capabilities = ["vision", "text", "cutout", "video"],
  disabled = false,
  compact = false,
}: AiEngineSelectorProps) {
  function updateCapability(capability: AiCapability, provider: AiEngineProvider) {
    onChange({ ...value, [capability]: provider });
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {capabilities.map((capability) => {
        const meta = AI_CAPABILITY_LABELS[capability];
        const rawValue = value[capability] ?? DEFAULT_AI_ENGINES[capability];
        const selectedValue =
          (capability === "cutout" || capability === "video") &&
          rawValue === "gemini"
            ? "auto"
            : rawValue;
        return (
          <div key={capability} className="space-y-1.5">
            <Label className="text-xs font-light text-muted-foreground">
              {meta.label}
            </Label>
            <Select
              dir="rtl"
              value={selectedValue}
              onValueChange={(next) =>
                updateCapability(capability, next as AiEngineProvider)
              }
              disabled={disabled}
            >
              <SelectTrigger className="rounded-none bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {engineOptionsForCapability(capability).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!compact && (
              <p className="text-[10px] font-light text-muted-foreground">
                {meta.hint}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
