"use client";

import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";

/** אזור העלאת צילום גלם — Cloudinary widget */
export function StudioUploadZone({
  hasSource,
  onUploaded,
  disabled,
}: {
  hasSource: boolean;
  onUploaded: (url: string) => void;
  disabled?: boolean;
}) {
  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      options={{
        maxFiles: 1,
        multiple: false,
        folder: "yerushalmi-studio",
        resourceType: "image",
      }}
      onSuccess={(result) => {
        if (
          typeof result.info === "object" &&
          result.info &&
          "secure_url" in result.info
        ) {
          onUploaded(String(result.info.secure_url));
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
            החלפת צילום
          </Button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => open()}
            className="flex w-full flex-col items-center justify-center gap-3 border border-dashed border-gold/40 bg-gold/5 px-6 py-14 text-center transition-colors hover:border-gold hover:bg-gold/10 disabled:opacity-50"
          >
            <ImagePlus className="h-8 w-8 text-gold-dark" />
            <span className="text-sm font-light">העלאת צילום גולמי</span>
            <span className="text-[11px] font-light text-muted-foreground">
              JPG / PNG · מינימום 2000×2000 · רקע אחיד · חד (macro)
            </span>
          </button>
        )
      }
    </CldUploadWidget>
  );
}
