"use client";

import * as React from "react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaPreviewTrigger } from "@/components/ui/media-preview";

type ProductImageFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  uploadLabel?: string;
};

export function ProductImageField({
  name,
  label,
  defaultValue = null,
  uploadLabel = "העלאת תמונה",
}: ProductImageFieldProps) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(defaultValue);

  return (
    <div className="space-y-2">
      <Label className="font-light">{label}</Label>
      <input type="hidden" name={name} value={imageUrl ?? ""} />

      {imageUrl ? (
        <div className="flex items-center gap-4">
          <MediaPreviewTrigger
            url={imageUrl}
            type="image"
            alt={label}
            className="relative block h-20 w-20 shrink-0 overflow-hidden border border-border/60"
          >
            <Image
              src={imageUrl}
              alt={label}
              fill
              sizes="80px"
              className="object-cover"
            />
          </MediaPreviewTrigger>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setImageUrl(null)}
            className="text-xs font-light text-muted-foreground hover:text-destructive"
          >
            <X className="ml-1 h-3.5 w-3.5" />
            הסרת תמונה
          </Button>
        </div>
      ) : (
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{ maxFiles: 1, multiple: false }}
          onSuccess={(result) => {
            if (
              typeof result.info === "object" &&
              result.info &&
              "secure_url" in result.info
            ) {
              setImageUrl(result.info.secure_url as string);
            }
          }}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              onClick={() => open()}
              className="w-full rounded-none border-dashed text-xs font-light tracking-[0.1em]"
            >
              <ImagePlus className="ml-2 h-4 w-4" strokeWidth={1.5} />
              {uploadLabel}
            </Button>
          )}
        </CldUploadWidget>
      )}
    </div>
  );
}
