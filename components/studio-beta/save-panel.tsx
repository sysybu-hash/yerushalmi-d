"use client";

import { useState } from "react";
import { Check, CheckCircle2, Copy, Download, Loader2, Pencil, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleChip } from "@/components/studio/studio-adjust-ui";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import { withDownloadFlag } from "@/lib/studio-beta/cloudinary-transform";
import { generateStudioBetaTitle } from "@/app/(ai-studio)/studio-beta/actions";

function ResultActions({
  url,
  filename,
  allowContinueEditing,
}: {
  url: string;
  filename: string;
  /** רק תוצאת-תמונה יכולה לשמש כתמונת מקור חדשה — לא וידאו */
  allowContinueEditing?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const setSourceImage = useStudioBetaStore((s) => s.setSourceImage);

  return (
    <div className="flex gap-2 text-[11px] font-light">
      <a
        href={withDownloadFlag(url)}
        download={filename}
        className="flex items-center gap-1 border border-border/60 px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
      >
        <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
        הורדה
      </a>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="flex items-center gap-1 border border-border/60 px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
        {copied ? "הועתק" : "העתקת קישור"}
      </button>
      {allowContinueEditing && (
        <button
          type="button"
          onClick={() => setSourceImage(url)}
          className="flex items-center gap-1 border border-border/60 px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
          המשך עריכה מכאן
        </button>
      )}
    </div>
  );
}

function SaveRow({
  label,
  saved,
  loading,
  error,
  title,
  onTitleChange,
  onSave,
  imageUrlForAi,
}: {
  label: string;
  saved: boolean;
  loading: boolean;
  error: string | null;
  title: string;
  onTitleChange: (v: string) => void;
  onSave: () => void;
  /** תמונת המוצר לניתוח AI ליצירת כותרת — תמיד תמונה סטטית, גם בשורת הווידאו */
  imageUrlForAi: string;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (saved) {
    return (
      <div className="flex items-center gap-2 border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-light">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-dark" />
        {label} נשמר/ה בספריית התוכן
      </div>
    );
  }

  const fillWithAi = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateStudioBetaTitle(imageUrlForAi);
      onTitleChange(result.title);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "מילוי אוטומטי נכשל");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={`כותרת ל${label} (אופציונלי)`}
          className="rounded-none text-sm"
        />
        <button
          type="button"
          onClick={fillWithAi}
          disabled={aiLoading}
          title="מילוי כותרת אוטומטי ב-AI"
          className="flex shrink-0 items-center gap-1 border border-border/60 px-2.5 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {aiLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          מלא ב-AI
        </button>
      </div>
      {aiError && <p className="text-xs font-light text-destructive">{aiError}</p>}
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

function VideoTrimControls() {
  const video = useStudioBetaStore((s) => s.video);
  const setVideoTrim = useStudioBetaStore((s) => s.setVideoTrim);
  const setVideoMute = useStudioBetaStore((s) => s.setVideoMute);
  const setVideoEnhance = useStudioBetaStore((s) => s.setVideoEnhance);

  return (
    <div className="flex flex-wrap items-end gap-3 border border-border/60 p-2.5">
      <div className="space-y-1">
        <label className="text-[11px] font-light text-muted-foreground">
          התחלה (שנ&apos;)
        </label>
        <input
          type="number"
          min={0}
          value={video.trim.startSec ?? ""}
          onChange={(event) =>
            setVideoTrim(
              event.target.value === "" ? null : Number(event.target.value),
              video.trim.endSec
            )
          }
          className="w-20 border border-border/60 bg-transparent px-2 py-1 text-xs"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[11px] font-light text-muted-foreground">
          סוף (שנ&apos;)
        </label>
        <input
          type="number"
          min={0}
          value={video.trim.endSec ?? ""}
          onChange={(event) =>
            setVideoTrim(
              video.trim.startSec,
              event.target.value === "" ? null : Number(event.target.value)
            )
          }
          className="w-20 border border-border/60 bg-transparent px-2 py-1 text-xs"
        />
      </div>
      <ToggleChip
        label="השתקת אודיו"
        active={video.trim.mute}
        onClick={() => setVideoMute(!video.trim.mute)}
      />
      <ToggleChip
        label="שיפור חינמי (חידוד)"
        active={video.trim.enhance}
        onClick={() => setVideoEnhance(!video.trim.enhance)}
      />
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

  const [imageTitle, setImageTitle] = useState("");
  const [videoTitle, setVideoTitle] = useState("");

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
        <ResultActions
          url={background.url}
          filename="yerushalmi-jewelry.png"
          allowContinueEditing
        />
        <SaveRow
          label="התמונה"
          saved={imageSave.status === "done"}
          loading={imageSave.status === "loading"}
          error={imageSave.error}
          title={imageTitle}
          onTitleChange={setImageTitle}
          onSave={() => saveImageToLibrary(imageTitle)}
          imageUrlForAi={background.url}
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
          {video.url && (
            <ResultActions url={video.url} filename="yerushalmi-jewelry.mp4" />
          )}
          {video.mediaKind === "video" && <VideoTrimControls />}
          <SaveRow
            label="הווידאו"
            saved={videoSave.status === "done"}
            loading={videoSave.status === "loading"}
            error={videoSave.error}
            title={videoTitle}
            onTitleChange={setVideoTitle}
            onSave={() => saveVideoToLibrary(videoTitle)}
            imageUrlForAi={background.url}
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
