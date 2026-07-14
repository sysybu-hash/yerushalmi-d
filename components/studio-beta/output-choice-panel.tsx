"use client";

import { Image as ImageIcon, Video, VideoOff } from "lucide-react";
import { VideoPanel } from "@/components/studio-beta/video-panel";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import type { ProvidersConfigured } from "@/lib/studio-beta/engines";
import { cn } from "@/lib/utils";

export function OutputChoicePanel({
  providers,
}: {
  providers: ProvidersConfigured;
}) {
  const outputChoice = useStudioBetaStore((s) => s.outputChoice);
  const chooseOutput = useStudioBetaStore((s) => s.chooseOutput);
  const sourceKind = useStudioBetaStore((s) => s.sourceKind);
  const originalVideoUrl = useStudioBetaStore((s) => s.originalVideoUrl);
  const continueWithOriginalVideo = useStudioBetaStore(
    (s) => s.continueWithOriginalVideo
  );

  const showOriginalOption = sourceKind === "video" && Boolean(originalVideoUrl);

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "grid gap-3",
          showOriginalOption ? "grid-cols-3" : "grid-cols-2"
        )}
      >
        <button
          type="button"
          onClick={() => chooseOutput("image")}
          className={cn(
            "flex flex-col items-center gap-2 border px-4 py-6 transition-colors",
            outputChoice === "image"
              ? "border-gold bg-gold/10"
              : "border-border/60 hover:border-gold/60"
          )}
        >
          <ImageIcon className="h-6 w-6 text-gold-dark" strokeWidth={1} />
          <span className="text-sm font-light">השאר כתמונה</span>
        </button>
        <button
          type="button"
          onClick={() => chooseOutput("video")}
          className={cn(
            "flex flex-col items-center gap-2 border px-4 py-6 transition-colors",
            outputChoice === "video"
              ? "border-gold bg-gold/10"
              : "border-border/60 hover:border-gold/60"
          )}
        >
          <Video className="h-6 w-6 text-gold-dark" strokeWidth={1} />
          <span className="text-sm font-light">צור וידאו</span>
        </button>
        {showOriginalOption && (
          <button
            type="button"
            onClick={() => continueWithOriginalVideo()}
            className="flex flex-col items-center gap-2 border border-border/60 px-4 py-6 transition-colors hover:border-gold/60"
          >
            <VideoOff className="h-6 w-6 text-gold-dark" strokeWidth={1} />
            <span className="text-sm font-light">המשך עם הווידאו המקורי</span>
          </button>
        )}
      </div>

      {outputChoice === "video" && <VideoPanel providers={providers} />}
    </div>
  );
}
