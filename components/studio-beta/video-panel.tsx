"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EnginePicker } from "@/components/studio-beta/engine-picker";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import {
  VIDEO_ENGINES,
  estimateEngineCostUsd,
  type ProvidersConfigured,
} from "@/lib/studio-beta/engines";
import { cn } from "@/lib/utils";

const DURATIONS = [4, 6, 8];

export function VideoPanel({ providers }: { providers: ProvidersConfigured }) {
  const video = useStudioBetaStore((s) => s.video);
  const setVideoEngine = useStudioBetaStore((s) => s.setVideoEngine);
  const setVideoDuration = useStudioBetaStore((s) => s.setVideoDuration);
  const setVideoCustomPrompt = useStudioBetaStore((s) => s.setVideoCustomPrompt);
  const runVideo = useStudioBetaStore((s) => s.runVideo);

  const loading = video.status === "loading";

  return (
    <div className="space-y-4 border-t border-border/60 pt-4">
      <div>
        <p className="mb-2 text-xs font-light tracking-wide text-muted-foreground">
          מנוע הווידאו
        </p>
        <EnginePicker
          engines={VIDEO_ENGINES}
          estimateCost={estimateEngineCostUsd}
          value={video.engine}
          onChange={(id) => setVideoEngine(id as typeof video.engine)}
          providers={providers}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-light tracking-wide text-muted-foreground">
          משך (שניות)
        </p>
        <div className="flex gap-2">
          {DURATIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setVideoDuration(sec)}
              className={cn(
                "border px-3 py-1 text-xs font-light",
                video.durationSec === sec
                  ? "border-gold bg-gold/10"
                  : "border-border/60 hover:border-gold/60"
              )}
            >
              {sec} שנ&apos;
            </button>
          ))}
        </div>
      </div>

      <Textarea
        value={video.customPrompt}
        onChange={(event) => setVideoCustomPrompt(event.target.value)}
        placeholder="הנחיה נוספת לווידאו (אופציונלי)"
        className="rounded-none text-sm"
        rows={2}
      />

      <Button
        type="button"
        onClick={runVideo}
        disabled={loading}
        className="w-full rounded-none text-xs tracking-[0.1em]"
      >
        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        {video.status === "done" ? "צור וידאו מחדש" : "צור וידאו"}
      </Button>

      {video.error && (
        <p className="text-xs font-light text-destructive">{video.error}</p>
      )}

      {video.url && video.mediaKind === "gif" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.url}
          alt="תצוגת תנועה"
          className="max-h-[420px] w-full border border-border/60 object-contain"
        />
      )}
      {video.url && video.mediaKind === "video" && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={video.url}
          controls
          playsInline
          className="max-h-[420px] w-full border border-border/60"
        />
      )}
    </div>
  );
}
