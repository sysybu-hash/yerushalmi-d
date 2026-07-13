"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EnginePicker } from "@/components/studio-beta/engine-picker";
import { ToggleChip } from "@/components/studio/studio-adjust-ui";
import { AttemptsRail } from "@/components/studio-beta/attempts-rail";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import {
  VIDEO_ENGINES,
  estimateEngineCostUsd,
  type ProvidersConfigured,
} from "@/lib/studio-beta/engines";
import { VIDEO_MOTION_PRESETS, MUSIC_STYLE_PRESETS } from "@/lib/studio-beta/cloudinary-transform";
import { VIDEO_PROMPT_EXAMPLES } from "@/lib/studio-beta/prompt-examples";
import { cn } from "@/lib/utils";

const DURATIONS = [4, 6, 8];

export function VideoPanel({ providers }: { providers: ProvidersConfigured }) {
  const video = useStudioBetaStore((s) => s.video);
  const setVideoEngine = useStudioBetaStore((s) => s.setVideoEngine);
  const setVideoDuration = useStudioBetaStore((s) => s.setVideoDuration);
  const setVideoCustomPrompt = useStudioBetaStore((s) => s.setVideoCustomPrompt);
  const setVideoNegativePrompt = useStudioBetaStore((s) => s.setVideoNegativePrompt);
  const setVideoGenerateAudio = useStudioBetaStore((s) => s.setVideoGenerateAudio);
  const toggleVideoMotion = useStudioBetaStore((s) => s.toggleVideoMotion);
  const setVideoMusicStyle = useStudioBetaStore((s) => s.setVideoMusicStyle);
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

      {video.engine === "cloudinary-preserve" && (
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs font-light tracking-wide text-muted-foreground">
              זום
            </p>
            <div className="grid grid-cols-2 gap-2">
              {VIDEO_MOTION_PRESETS.filter((p) => p.axis === "zoom").map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => toggleVideoMotion(preset.id)}
                  className={cn(
                    "border px-2 py-1.5 text-[11px] font-light",
                    video.motion.includes(preset.id)
                      ? "border-gold bg-gold/10"
                      : "border-border/60 hover:border-gold/60"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-light tracking-wide text-muted-foreground">
              פאן (ניתן לשילוב עם זום)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {VIDEO_MOTION_PRESETS.filter((p) => p.axis === "pan").map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => toggleVideoMotion(preset.id)}
                  className={cn(
                    "border px-2 py-1.5 text-[11px] font-light",
                    video.motion.includes(preset.id)
                      ? "border-gold bg-gold/10"
                      : "border-border/60 hover:border-gold/60"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-light tracking-wide text-muted-foreground">
              מוזיקת רקע
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MUSIC_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setVideoMusicStyle(preset.id)}
                  className={cn(
                    "border px-2 py-1.5 text-[11px] font-light",
                    video.musicStyle === preset.id
                      ? "border-gold bg-gold/10"
                      : "border-border/60 hover:border-gold/60"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

      <div>
        <Textarea
          value={video.customPrompt}
          onChange={(event) => setVideoCustomPrompt(event.target.value)}
          placeholder="הנחיה נוספת לווידאו (אופציונלי)"
          className="rounded-none text-sm"
          rows={2}
        />
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {VIDEO_PROMPT_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setVideoCustomPrompt(example)}
              className="border border-border/60 px-2 py-1 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {video.engine === "kling-v3" && (
        <div className="space-y-2.5">
          <details className="group">
            <summary className="cursor-pointer text-[11px] font-light text-muted-foreground hover:text-foreground">
              מה להימנע ממנו (אופציונלי)
            </summary>
            <Textarea
              value={video.negativePrompt}
              onChange={(event) => setVideoNegativePrompt(event.target.value)}
              placeholder="לדוגמה: ללא סיבוב מצלמה מהיר"
              className="mt-1.5 rounded-none text-sm"
              rows={2}
            />
          </details>
          <ToggleChip
            label="אודיו טבעי"
            active={video.generateAudio}
            onClick={() => setVideoGenerateAudio(!video.generateAudio)}
          />
        </div>
      )}

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

      <AttemptsRail kind="video" />
    </div>
  );
}
