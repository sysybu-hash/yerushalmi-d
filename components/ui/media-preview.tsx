"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MediaPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  type?: "image" | "video";
  alt?: string;
};

export function MediaPreviewDialog({
  open,
  onOpenChange,
  url,
  type = "image",
  alt,
}: MediaPreviewDialogProps) {
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
      </DialogContent>
    </Dialog>
  );
}

type MediaPreviewTriggerProps = {
  url: string;
  type?: "image" | "video";
  alt?: string;
  className?: string;
  children: React.ReactNode;
};

/** לחיצה על תמונה/וידאו — תצוגה מקדימה בגודל מלא */
export function MediaPreviewTrigger({
  url,
  type = "image",
  alt,
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
      />
    </>
  );
}
