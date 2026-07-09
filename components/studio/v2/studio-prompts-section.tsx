"use client";

import type { StudioFlow } from "@/lib/studio-client/state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  STUDIO_PROMPT_EXAMPLES,
  STUDIO_VIDEO_PROMPT_EXAMPLES,
} from "@/lib/studio-presets";
import { StudioSection } from "./studio-section";

export function StudioPromptsSection({
  flow,
  customPrompt,
  videoPrompt,
  onCustomPromptChange,
  onVideoPromptChange,
  disabled,
}: {
  flow: StudioFlow;
  customPrompt: string;
  videoPrompt: string;
  onCustomPromptChange: (value: string) => void;
  onVideoPromptChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <StudioSection title="הנחיות (prompts)">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-light text-muted-foreground">
            הנחיית תמונה (עברית — מתורגמת אוטומטית)
          </Label>
          <Textarea
            dir="rtl"
            rows={2}
            value={customPrompt}
            disabled={disabled}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder={STUDIO_PROMPT_EXAMPLES[0]}
            className="rounded-none text-sm font-light"
          />
          <div className="flex flex-wrap gap-1.5">
            {STUDIO_PROMPT_EXAMPLES.slice(0, 4).map((example) => (
              <button
                key={example}
                type="button"
                disabled={disabled}
                onClick={() => onCustomPromptChange(example)}
                className="border border-border/50 px-2 py-0.5 text-[10px] font-light text-muted-foreground hover:border-gold/50 hover:text-foreground"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {flow === "marketing" && (
          <div className="space-y-1.5 border-t border-border/40 pt-3">
            <Label className="text-xs font-light text-muted-foreground">
              הנחיית וידאו
            </Label>
            <Textarea
              dir="rtl"
              rows={2}
              value={videoPrompt}
              disabled={disabled}
              onChange={(e) => onVideoPromptChange(e.target.value)}
              placeholder="מצלמה קבועה, נצנוץ עדין על היהלומים בלבד"
              className="rounded-none text-sm font-light"
            />
            <div className="flex flex-wrap gap-1.5">
              {STUDIO_VIDEO_PROMPT_EXAMPLES.slice(0, 3).map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={disabled}
                  onClick={() => onVideoPromptChange(example)}
                  className="border border-border/50 px-2 py-0.5 text-[10px] font-light text-muted-foreground hover:border-gold/50 hover:text-foreground"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudioSection>
  );
}
