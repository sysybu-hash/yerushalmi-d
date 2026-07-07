"use client";

import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";

/** אזור העלאה — תמונה גולמית או וידאו קיים לעריכה */
export function StudioUploadZone({
  hasSource,
  onUploaded,
  disabled,
}: {
  hasSource: boolean;
  onUploaded: (url: string, kind: "image" | "video", duration?: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      options={{
        maxFiles: 1,
        multiple: false,
        folder: "yerushalmi-studio",
        resourceType: "auto",
      }}
      onSuccess={(result) => {
        if (
          typeof result.info === "object" &&
          result.info &&
          "secure_url" in result.info
        ) {
          const info = result.info as {
            secure_url: string;
            resource_type?: string;
            duration?: number;
          };
          onUploaded(
            info.secure_url,
            info.resource_type === "video" ? "video" : "image",
            info.duration ?? null
          );
        }
      }}
    >
      {({ open }) =>
        hasSource ? (
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => open()}
            className="rounded-none text-xs font-light"
          >
            <ImagePlus className="ml-1.5 h-3.5 w-3.5" />
            החלפת קובץ
          </Button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => open()}
            className="flex w-full flex-col items-center justify-center gap-3 border border-dashed border-gold/40 bg-gold/5 px-6 py-14 text-center transition-colors hover:border-gold hover:bg-gold/10 disabled:opacity-50"
          >
            <ImagePlus className="h-8 w-8 text-gold-dark" />
            <span className="text-sm font-light">
              העלאת צילום גולמי או וידאו קיים
            </span>
            <span className="text-[11px] font-light text-muted-foreground">
              תמונה: JPG / PNG · מינימום 2000×2000 · רקע אחיד
              <br />
              וידאו: MP4 / MOV — לעריכה, מוזיקה ומיטוב
            </span>
          </button>
        )
      }
    </CldUploadWidget>
  );
}
