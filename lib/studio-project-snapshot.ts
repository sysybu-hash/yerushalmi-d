import type { StudioPipelineStepId, StudioStylePresetId, StudioWorkspaceUploadModeId } from "@/lib/studio-presets";
import type { SettingKey } from "@/lib/site-settings";

export type StudioWorkflowStepNumber = 1 | 2 | 3 | 4;

export type StudioClientState =
  | { status: "empty" }
  | { status: "uploaded"; source: string }
  | {
      status: "generating";
      source: string;
      kind: "image" | "video";
      step?: StudioPipelineStepId;
    }
  | {
      status: "done";
      source: string;
      kind: "image" | "video";
      result: string;
      savedUrl?: string;
      videoProvider?: "kling" | "svd";
    }
  | { status: "error"; source: string; message: string };

export type StudioProjectSnapshot = {
  version: 1;
  mode: "create" | "edit";
  workflowStep: StudioWorkflowStepNumber;
  state: StudioClientState;
  customPrompt: string;
  negativePrompt: string;
  stylePreset: StudioStylePresetId;
  videoPrompt: string;
  videoDuration: 5 | 10;
  videoMode: "standard" | "pro";
  workspaceUploadMode: StudioWorkspaceUploadModeId;
  publishTarget: SettingKey;
  productTitle: string;
  productDescription: string;
  productPrice: string;
  productOriginalPrice: string;
  productType: "natural" | "lab";
  productCategory: string;
};

export const EMPTY_STUDIO_SNAPSHOT: StudioProjectSnapshot = {
  version: 1,
  mode: "create",
  workflowStep: 1,
  state: { status: "empty" },
  customPrompt: "",
  negativePrompt: "",
  stylePreset: "luxury-marble",
  videoPrompt: "",
  videoDuration: 5,
  videoMode: "pro",
  workspaceUploadMode: "site-banner",
  publishTarget: "heroImage",
  productTitle: "",
  productDescription: "",
  productPrice: "",
  productOriginalPrice: "",
  productType: "natural",
  productCategory: "rings",
};

export function snapshotThumbnailUrl(snapshot: StudioProjectSnapshot): string | null {
  const { state } = snapshot;
  if (state.status === "done") {
    return state.savedUrl ?? state.result ?? state.source;
  }
  if ("source" in state && state.source) {
    return state.source;
  }
  return null;
}

export function snapshotStatusLabel(
  status: "draft" | "in_progress" | "ready" | "published"
): string {
  switch (status) {
    case "draft":
      return "טיוטה";
    case "in_progress":
      return "בעבודה";
    case "ready":
      return "מוכן לפרסום";
    case "published":
      return "פורסם";
  }
}
