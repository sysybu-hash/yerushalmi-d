"use client";

import type {
  AiBackgroundProvider,
  AiCapability,
  AiEngineConfig,
  AiEngineProvider,
} from "@/lib/ai-engines";
import {
  AI_BACKGROUND_LABEL,
  AI_BACKGROUND_OPTIONS,
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
  showBackground?: boolean;
  disabled?: boolean;
  compact?: boolean;
};

export function AiEngineSelector({
  value,
  onChange,
  capabilities = ["vision", "text", "cutout", "video"],
  showBackground = true,
  disabled = false,
  compact = false,
}: AiEngineSelectorProps) {
  function updateCapability(capability: AiCapability, provider: AiEngineProvider) {
    onChange({ ...value, [capability]: provider });
  }

  function updateBackground(provider: AiBackgroundProvider) {
    onChange({ ...value, background: provider });
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

      {showBackground && (
        <div className="space-y-1.5">
          <Label className="text-xs font-light text-muted-foreground">
            {AI_BACKGROUND_LABEL.label}
          </Label>
          <Select
            dir="rtl"
            value={value.background ?? DEFAULT_AI_ENGINES.background}
            onValueChange={(next) =>
              updateBackground(next as AiBackgroundProvider)
            }
            disabled={disabled}
          >
            <SelectTrigger className="rounded-none bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_BACKGROUND_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!compact && (
            <p className="text-[10px] font-light text-muted-foreground">
              {AI_BACKGROUND_LABEL.hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
