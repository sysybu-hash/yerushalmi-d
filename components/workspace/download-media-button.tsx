"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildMediaFilename,
  downloadMediaAsset,
  type MediaDownloadType,
} from "@/lib/download-media";
import { cn } from "@/lib/utils";

type DownloadMediaButtonProps = {
  url: string;
  mediaType: MediaDownloadType;
  title?: string | null;
  assetId?: number;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
  showIcon?: boolean;
};

export function DownloadMediaButton({
  url,
  mediaType,
  title,
  assetId,
  variant = "outline",
  size = "sm",
  className,
  label = "הורדה",
  showIcon = true,
}: DownloadMediaButtonProps) {
  const [pending, setPending] = React.useState(false);

  async function handleDownload(event: React.MouseEvent) {
    event.stopPropagation();
    if (pending) return;

    setPending(true);
    try {
      await downloadMediaAsset(
        url,
        mediaType,
        buildMediaFilename(mediaType, { title, id: assetId })
      );
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "ההורדה נכשלה — נסו שוב"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={handleDownload}
      className={cn("rounded-none text-xs font-light", className)}
    >
      {pending ? (
        <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
      ) : showIcon ? (
        <Download className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
      ) : null}
      {label}
    </Button>
  );
}
