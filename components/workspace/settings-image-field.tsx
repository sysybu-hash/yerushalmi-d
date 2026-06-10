"use client";

import * as React from "react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type SettingsImageFieldProps = {
  name: string;
  label: string;
  defaultValue: string;
};

/** שדה תמונה להגדרות: העלאה ל-Cloudinary + תצוגה מקדימה + שדה נסתר */
export function SettingsImageField({
  name,
  label,
  defaultValue,
}: SettingsImageFieldProps) {
  const [imageUrl, setImageUrl] = React.useState(defaultValue);

  return (
    <div className="space-y-2">
      <Label className="font-light">{label}</Label>
      <input type="hidden" name={name} value={imageUrl} />

      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-muted/40">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={label}
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <ImagePlus
              className="h-5 w-5 text-muted-foreground"
              strokeWidth={1.25}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
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
                size="sm"
                onClick={() => open()}
                className="rounded-none text-xs font-light tracking-[0.1em]"
              >
                החלפת תמונה
              </Button>
            )}
          </CldUploadWidget>

          {imageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setImageUrl("")}
              className="text-xs font-light text-muted-foreground hover:text-destructive"
            >
              <X className="ml-1 h-3 w-3" />
              הסרה (חזרה לברירת מחדל)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
