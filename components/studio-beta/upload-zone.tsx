"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { CldUploadWidget, type CldUploadWidgetProps } from "next-cloudinary";
import { cn } from "@/lib/utils";

type UploadZoneProps = {
  onUploaded: (url: string) => void;
  className?: string;
  compact?: boolean;
};

export function UploadZone({ onUploaded, className, compact }: UploadZoneProps) {
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const onSuccess: CldUploadWidgetProps["onSuccess"] = (results) => {
    const info = results?.info;
    if (info && typeof info === "object" && "secure_url" in info) {
      onUploaded(String(info.secure_url));
    }
  };

  return (
    <CldUploadWidget uploadPreset={preset} onSuccess={onSuccess}>
      {({ open, isLoading }) => (
        <button
          type="button"
          onClick={() => open()}
          disabled={isLoading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 border border-dashed border-gold/40 bg-gold/5 px-6 py-12 text-center transition-colors hover:border-gold hover:bg-gold/10 disabled:opacity-50",
            compact && "py-6",
            className
          )}
        >
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-gold-dark" />
          ) : (
            <ImagePlus className="h-8 w-8 text-gold-dark" strokeWidth={1} />
          )}
          <div className="space-y-1">
            <p className="font-serif text-base font-light">
              {compact ? "החלפת תמונה" : "העלאת תמונת תכשיט"}
            </p>
            <p className="text-xs font-light tracking-wide text-muted-foreground">
              גררו לכאן קובץ או לחצו לבחירה
            </p>
          </div>
        </button>
      )}
    </CldUploadWidget>
  );
}
