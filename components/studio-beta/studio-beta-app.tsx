"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import type { ProvidersConfigured } from "@/lib/studio-beta/engines";
import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/studio-beta/step-header";
import { SessionCostMeter } from "@/components/studio-beta/session-cost-meter";
import { ResetBanner } from "@/components/studio-beta/reset-banner";
import { UploadZone } from "@/components/studio-beta/upload-zone";
import { VideoFramePicker } from "@/components/studio-beta/video-frame-picker";
import { ProjectsPanel } from "@/components/studio-beta/projects-panel";
import { BackgroundPanel } from "@/components/studio-beta/background-panel";
import { AutoMagicPanel } from "@/components/studio-beta/auto-magic-panel";
import { OutputChoicePanel } from "@/components/studio-beta/output-choice-panel";
import { SavePanel } from "@/components/studio-beta/save-panel";
import { TipsPanel } from "@/components/studio-beta/tips-panel";

export function StudioBetaApp({
  providers,
  initialSourceUrl,
}: {
  providers: ProvidersConfigured;
  initialSourceUrl?: string | null;
}) {
  const currentStep = useStudioBetaStore((s) => s.currentStep);
  const maxStepReached = useStudioBetaStore((s) => s.maxStepReached);
  const sourceImageUrl = useStudioBetaStore((s) => s.sourceImageUrl);
  const sourceKind = useStudioBetaStore((s) => s.sourceKind);
  const resetNotice = useStudioBetaStore((s) => s.resetNotice);
  const dismissResetNotice = useStudioBetaStore((s) => s.dismissResetNotice);
  const setSourceImage = useStudioBetaStore((s) => s.setSourceImage);
  const goToStep = useStudioBetaStore((s) => s.goToStep);
  const [uploadTab, setUploadTab] = useState<"new" | "projects">("new");
  const [pendingVideoUrl, setPendingVideoUrl] = useState<string | null>(null);

  // וידאו נדרש לבחירת פריים לפני שהוא הופך למקור בפועל; תמונה ממשיכה מיד
  const handleUploaded = (url: string, kind: "image" | "video") => {
    if (kind === "video") {
      setPendingVideoUrl(url);
      return;
    }
    setSourceImage(url, "image");
  };

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrlStep = useRef<number | null>(null);

  // חוזרים לסטודיו עם נכס שכבר נשמר בספריית התוכן (?source=...)
  useEffect(() => {
    if (initialSourceUrl && !useStudioBetaStore.getState().sourceImageUrl) {
      setSourceImage(initialSourceUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSourceUrl]);

  // כתובת ה-URL <- store: תומך בכפתור "חזור"/"קדימה" של הדפדפן
  useEffect(() => {
    const stepParam = Number(searchParams.get("step"));
    if (
      stepParam >= 1 &&
      stepParam <= 4 &&
      stepParam !== lastUrlStep.current
    ) {
      lastUrlStep.current = stepParam;
      if (stepParam !== useStudioBetaStore.getState().currentStep) {
        goToStep(stepParam as 1 | 2 | 3 | 4);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // store -> כתובת ה-URL: כל שינוי שלב נכנס להיסטוריית הדפדפן
  useEffect(() => {
    if (lastUrlStep.current === currentStep) return;
    lastUrlStep.current = currentStep;
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", String(currentStep));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StepHeader
          currentStep={currentStep}
          maxStepReached={maxStepReached}
          onStepClick={goToStep}
        />
        <SessionCostMeter />
      </div>

      {resetNotice && (
        <ResetBanner message={resetNotice} onDismiss={dismissResetNotice} />
      )}

      <TipsPanel />

      {pendingVideoUrl ? (
        <VideoFramePicker
          videoUrl={pendingVideoUrl}
          onConfirm={(frameOffsetSec) => {
            setSourceImage(pendingVideoUrl, "video", frameOffsetSec);
            setPendingVideoUrl(null);
          }}
          onCancel={() => setPendingVideoUrl(null)}
        />
      ) : currentStep === 1 ? (
        <div className="space-y-4">
          <div className="flex gap-2 text-xs font-light tracking-wide">
            <button
              type="button"
              onClick={() => setUploadTab("new")}
              className={cn(
                "border px-4 py-2 transition-colors",
                uploadTab === "new"
                  ? "border-gold bg-gold/10 text-gold-dark"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              עבודה חדשה
            </button>
            <button
              type="button"
              onClick={() => setUploadTab("projects")}
              className={cn(
                "border px-4 py-2 transition-colors",
                uploadTab === "projects"
                  ? "border-gold bg-gold/10 text-gold-dark"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              פרויקטים קודמים
            </button>
          </div>

          {uploadTab === "new" ? (
            <UploadZone onUploaded={handleUploaded} />
          ) : (
            <ProjectsPanel />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border border-border/40 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sourceImageUrl ?? undefined}
              alt="תמונת המקור"
              className="h-14 w-14 shrink-0 object-cover"
            />
            <span className="flex-1 text-xs font-light text-muted-foreground">
              {sourceKind === "video" ? "פריים מהוידאו שהועלה" : "תמונת המקור"}
            </span>
            <UploadZone
              onUploaded={handleUploaded}
              compact
              className="w-auto px-4 py-2"
            />
          </div>

          {currentStep === 2 && (
            <>
              <AutoMagicPanel providers={providers} />
              <BackgroundPanel providers={providers} />
            </>
          )}
          {currentStep === 3 && <OutputChoicePanel providers={providers} />}
          {currentStep === 4 && <SavePanel />}
        </div>
      )}
    </div>
  );
}
