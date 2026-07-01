"use client";

import type { AiCapability, AiEngineConfig, AiEngineProvider } from "@/lib/ai-engines";
import {
  AI_CAPABILITY_LABELS,
  AI_ENGINE_OPTIONS,
  DEFAULT_AI_ENGINES,
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
        return (
          <div key={capability} className="space-y-1.5">
            <Label className="text-xs font-light text-muted-foreground">
              {meta.label}
            </Label>
            <Select
              dir="rtl"
              value={value[capability] ?? DEFAULT_AI_ENGINES[capability]}
              onValueChange={(next) =>
                updateCapability(capability, next as AiEngineProvider)
              }
              disabled={disabled}
            >
              <SelectTrigger className="rounded-none bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_ENGINE_OPTIONS.map((option) => (
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
