"use client";

import { CheckCircle2, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudioBetaStore } from "@/lib/studio-beta/store";

function SaveRow({
  label,
  saved,
  loading,
  error,
  onSave,
}: {
  label: string;
  saved: boolean;
  loading: boolean;
  error: string | null;
  onSave: () => void;
}) {
  if (saved) {
    return (
      <div className="flex items-center gap-2 border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-light">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-dark" />
        {label} נשמר/ה בספריית התוכן
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <Button
        type="button"
        onClick={onSave}
        disabled={loading}
        className="w-full rounded-none text-xs tracking-[0.1em]"
      >
        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        שמירת {label} לספריית תוכן
      </Button>
      {error && <p className="text-xs font-light text-destructive">{error}</p>}
    </div>
  );
}

export function SavePanel() {
  const background = useStudioBetaStore((s) => s.background);
  const video = useStudioBetaStore((s) => s.video);
  const imageSave = useStudioBetaStore((s) => s.imageSave);
  const videoSave = useStudioBetaStore((s) => s.videoSave);
  const saveImageToLibrary = useStudioBetaStore((s) => s.saveImageToLibrary);
  const saveVideoToLibrary = useStudioBetaStore((s) => s.saveVideoToLibrary);
  const continueToVideo = useStudioBetaStore((s) => s.continueToVideo);
  const startOver = useStudioBetaStore((s) => s.startOver);

  const hasVideo = Boolean(video.url);
  if (!background.url) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={background.url}
          alt="תמונת התוצאה"
          className="max-h-[420px] w-full border border-border/60 object-contain"
        />
        <SaveRow
          label="התמונה"
          saved={imageSave.status === "done"}
          loading={imageSave.status === "loading"}
          error={imageSave.error}
          onSave={saveImageToLibrary}
        />
      </div>

      {hasVideo ? (
        <div className="space-y-2 border-t border-border/60 pt-4">
          {video.mediaKind === "gif" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.url ?? undefined}
              alt="תצוגת תנועה"
              className="max-h-[420px] w-full border border-border/60 object-contain"
            />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={video.url ?? undefined}
              controls
              playsInline
              className="max-h-[420px] w-full border border-border/60"
            />
          )}
          <SaveRow
            label="הווידאו"
            saved={videoSave.status === "done"}
            loading={videoSave.status === "loading"}
            error={videoSave.error}
            onSave={saveVideoToLibrary}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={continueToVideo}
          className="w-full rounded-none text-xs tracking-[0.1em]"
        >
          <Video className="ml-2 h-4 w-4" strokeWidth={1.5} />
          המשך ליצירת וידאו מהתמונה הזו
        </Button>
      )}

      {(imageSave.status === "done" || videoSave.status === "done") && (
        <Button
          type="button"
          variant="outline"
          onClick={startOver}
          className="w-full rounded-none text-xs tracking-[0.1em]"
        >
          עבודה חדשה
        </Button>
      )}
    </div>
  );
}
