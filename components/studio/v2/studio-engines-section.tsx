"use client";

import type { AiCapability, AiEngineConfig } from "@/lib/ai-engines";
import type { StudioFlow } from "@/lib/studio-client/state";
import { resolvedCutoutHint } from "@/lib/studio-engine-ui";
import { AiEngineSelector } from "@/components/studio/ai-engine-selector";
import { StudioSection } from "./studio-section";

export function StudioEnginesSection({
  flow,
  engines,
  onChange,
  disabled,
}: {
  flow: StudioFlow;
  engines: AiEngineConfig;
  onChange: (engines: AiEngineConfig) => void;
  disabled?: boolean;
}) {
  const capabilities: AiCapability[] =
    flow === "marketing" ? ["cutout", "video"] : ["cutout"];

  return (
    <StudioSection title={flow === "catalog" ? "בידוד (הסרת רקע)" : "מנועי AI"}>
      <div className="space-y-2">
        <AiEngineSelector
          value={engines}
          onChange={onChange}
          capabilities={capabilities}
          showBackground={flow === "marketing"}
          compact
          disabled={disabled}
        />
        {flow === "catalog" && (
          <p className="text-[10px] font-light text-muted-foreground">
            {resolvedCutoutHint(engines.cutout)}
          </p>
        )}
      </div>
    </StudioSection>
  );
}
