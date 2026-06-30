"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  buildMediaFilename,
  downloadMediaAsset,
  type MediaDownloadType,
} from "@/lib/download-media";
import { cn } from "@/lib/utils";

type MediaPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  type?: MediaDownloadType;
  alt?: string;
  downloadTitle?: string | null;
  downloadId?: number;
};

export function MediaPreviewDialog({
  open,
  onOpenChange,
  url,
  type = "image",
  alt,
  downloadTitle,
  downloadId,
}: MediaPreviewDialogProps) {
  const [downloading, setDownloading] = React.useState(false);

  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadMediaAsset(
        url,
        type,
        buildMediaFilename(type, { title: downloadTitle ?? alt, id: downloadId })
      );
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "ההורדה נכשלה"
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-[min(96vw,56rem)] gap-0 overflow-hidden rounded-none border-border/40 bg-background p-2 sm:p-3"
      >
        <DialogTitle className="sr-only">
          {alt ? `תצוגה מקדימה: ${alt}` : "תצוגה מקדימה"}
        </DialogTitle>
        <div className="flex min-h-[200px] max-h-[85vh] w-full items-center justify-center bg-muted/20">
          {type === "video" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={url}
              controls
              autoPlay
              playsInline
              className="max-h-[85vh] max-w-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={alt ?? ""}
              className="max-h-[85vh] max-w-full object-contain"
            />
          )}
        </div>
        <div className="border-t border-border/40 p-3">
          <Button
            type="button"
            variant="outline"
            disabled={downloading}
            onClick={handleDownload}
            className="w-full rounded-none text-xs font-light tracking-wide"
          >
            {downloading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="ml-2 h-4 w-4" strokeWidth={1.5} />
            )}
            הורדה למכשיר
          </Button>
          {downloadError && (
            <p className="mt-2 text-center text-xs font-light text-destructive">
              {downloadError}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type MediaPreviewTriggerProps = {
  url: string;
  type?: MediaDownloadType;
  alt?: string;
  downloadTitle?: string | null;
  downloadId?: number;
  className?: string;
  children: React.ReactNode;
};

/** לחיצה על תמונה/וידאו — תצוגה מקדימה בגודל מלא */
export function MediaPreviewTrigger({
  url,
  type = "image",
  alt,
  downloadTitle,
  downloadId,
  className,
  children,
}: MediaPreviewTriggerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "cursor-zoom-in border-0 bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        aria-label={alt ? `תצוגה מקדימה: ${alt}` : "תצוגה מקדימה"}
      >
        {children}
      </button>
      <MediaPreviewDialog
        open={open}
        onOpenChange={setOpen}
        url={url}
        type={type}
        alt={alt}
        downloadTitle={downloadTitle}
        downloadId={downloadId}
      />
    </>
  );
}
