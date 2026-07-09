"use client";

import type { AiCapability, AiEngineConfig } from "@/lib/ai-engines";
import type { StudioFlow } from "@/lib/studio-client/state";
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
    <StudioSection title="מנועי AI">
      <AiEngineSelector
        value={engines}
        onChange={onChange}
        capabilities={capabilities}
        showBackground={flow === "catalog"}
        compact
        disabled={disabled}
      />
    </StudioSection>
  );
}
