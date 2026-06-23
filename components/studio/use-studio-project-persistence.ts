"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  createStudioProject,
  getStudioProject,
  listStudioProjects,
  markStudioProjectPublished,
  saveStudioProject,
  type StudioProjectListItem,
} from "@/app/(ai-studio)/studio/project-actions";
import {
  EMPTY_STUDIO_SNAPSHOT,
  type StudioClientState,
  type StudioProjectSnapshot,
} from "@/lib/studio-project-snapshot";
import type { StudioWorkflowStep } from "@/components/studio/studio-workflow-stepper";
import type { StudioStylePresetId, StudioWorkspaceUploadModeId } from "@/lib/studio-presets";
import type { SettingKey } from "@/lib/site-settings";

export type StudioFormState = {
  state: StudioClientState;
  mode: "create" | "edit";
  workflowStep: StudioWorkflowStep;
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

export function formToSnapshot(form: StudioFormState): StudioProjectSnapshot {
  return {
    version: 1,
    mode: form.mode,
    workflowStep: form.workflowStep,
    state: form.state,
    customPrompt: form.customPrompt,
    negativePrompt: form.negativePrompt,
    stylePreset: form.stylePreset,
    videoPrompt: form.videoPrompt,
    videoDuration: form.videoDuration,
    videoMode: form.videoMode,
    workspaceUploadMode: form.workspaceUploadMode,
    publishTarget: form.publishTarget,
    productTitle: form.productTitle,
    productDescription: form.productDescription,
    productPrice: form.productPrice,
    productOriginalPrice: form.productOriginalPrice,
    productType: form.productType,
    productCategory: form.productCategory,
  };
}

export function snapshotToForm(snapshot: StudioProjectSnapshot): StudioFormState {
  return {
    mode: snapshot.mode,
    workflowStep: snapshot.workflowStep,
    state: snapshot.state,
    customPrompt: snapshot.customPrompt,
    negativePrompt: snapshot.negativePrompt,
    stylePreset: snapshot.stylePreset,
    videoPrompt: snapshot.videoPrompt,
    videoDuration: snapshot.videoDuration,
    videoMode: snapshot.videoMode,
    workspaceUploadMode: snapshot.workspaceUploadMode,
    publishTarget: snapshot.publishTarget,
    productTitle: snapshot.productTitle,
    productDescription: snapshot.productDescription,
    productPrice: snapshot.productPrice,
    productOriginalPrice: snapshot.productOriginalPrice,
    productType: snapshot.productType,
    productCategory: snapshot.productCategory,
  };
}

export function emptyStudioForm(): StudioFormState {
  return snapshotToForm(EMPTY_STUDIO_SNAPSHOT);
}

type UseStudioProjectPersistenceOptions = {
  form: StudioFormState;
  applyForm: (next: StudioFormState) => void;
  showToast: (message: string) => void;
};

export function useStudioProjectPersistence({
  form,
  applyForm,
  showToast,
}: UseStudioProjectPersistenceOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = React.useState<StudioProjectListItem[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(true);
  const [activeProjectId, setActiveProjectId] = React.useState<number | null>(
    null
  );
  const [saving, setSaving] = React.useState(false);
  const skipNextSave = React.useRef(false);
  const hydrated = React.useRef(false);

  const refreshProjects = React.useCallback(async () => {
    const list = await listStudioProjects();
    setProjects(list);
    return list;
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listStudioProjects();
        if (cancelled) return;
        setProjects(list);

        const param = searchParams.get("project");
        const id = param ? Number(param) : NaN;
        if (Number.isFinite(id) && id > 0) {
          const row = await getStudioProject(id);
          if (!cancelled) {
            skipNextSave.current = true;
            applyForm(snapshotToForm(row.snapshot));
            setActiveProjectId(row.id);
          }
        }
      } catch {
        if (!cancelled) {
          showToast("לא ניתן לטעון את תיק העבודות");
        }
      } finally {
        if (!cancelled) {
          setLoadingProjects(false);
          hydrated.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, applyForm, showToast]);

  const setProjectInUrl = React.useCallback(
    (id: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("project", String(id));
      } else {
        params.delete("project");
      }
      const qs = params.toString();
      router.replace(qs ? `/studio?${qs}` : "/studio", { scroll: false });
    },
    [router, searchParams]
  );

  const openProject = React.useCallback(
    async (id: number) => {
      try {
        const row = await getStudioProject(id);
        skipNextSave.current = true;
        applyForm(snapshotToForm(row.snapshot));
        setActiveProjectId(id);
        setProjectInUrl(id);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "פתיחת העבודה נכשלה");
      }
    },
    [applyForm, setProjectInUrl, showToast]
  );

  const startNewProject = React.useCallback(() => {
    skipNextSave.current = true;
    applyForm(emptyStudioForm());
    setActiveProjectId(null);
    setProjectInUrl(null);
  }, [applyForm, setProjectInUrl]);

  const ensureProject = React.useCallback(async (): Promise<number> => {
    if (activeProjectId) return activeProjectId;
    const snapshot = formToSnapshot(form);
    const created = await createStudioProject(snapshot);
    setActiveProjectId(created.id);
    setProjectInUrl(created.id);
    await refreshProjects();
    return created.id;
  }, [activeProjectId, form, refreshProjects, setProjectInUrl]);

  React.useEffect(() => {
    if (!hydrated.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (form.state.status === "generating") return;

    const timer = window.setTimeout(async () => {
      try {
        setSaving(true);
        const snapshot = formToSnapshot(form);
        const id =
          activeProjectId ??
          (form.state.status !== "empty"
            ? (await createStudioProject(snapshot)).id
            : null);

        if (!id) return;

        if (!activeProjectId) {
          setActiveProjectId(id);
          setProjectInUrl(id);
        }

        await saveStudioProject(id, snapshot);
        await refreshProjects();
      } catch {
        // silent autosave — user can keep working
      } finally {
        setSaving(false);
      }
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [
    form,
    activeProjectId,
    refreshProjects,
    setProjectInUrl,
  ]);

  const markPublished = React.useCallback(
    async (
      outcome:
        | { kind: "site"; settingKey: string }
        | { kind: "catalog"; productId: number }
    ) => {
      if (!activeProjectId) return;
      await markStudioProjectPublished(activeProjectId, outcome);
      await refreshProjects();
    },
    [activeProjectId, refreshProjects]
  );

  return {
    projects,
    loadingProjects,
    activeProjectId,
    saving,
    refreshProjects,
    openProject,
    startNewProject,
    ensureProject,
    markPublished,
  };
}
