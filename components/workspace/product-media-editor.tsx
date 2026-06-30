"use client";

import * as React from "react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { Clapperboard, ImagePlus, Trash2, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ProductMediaItem } from "@/lib/product-media";
import { sortProductMedia } from "@/lib/product-media";
import { cn } from "@/lib/utils";

type ProductMediaEditorProps = {
  name?: string;
  defaultItems: ProductMediaItem[];
};

export function ProductMediaEditor({
  name = "media_gallery",
  defaultItems,
}: ProductMediaEditorProps) {
  const [items, setItems] = React.useState<ProductMediaItem[]>(() =>
    sortProductMedia(defaultItems)
  );

  function removeAt(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem(item: ProductMediaItem) {
    setItems((prev) => sortProductMedia([...prev, item]));
  }

  return (
    <div className="space-y-3">
      <Label className="font-light">גלריית מדיה</Label>
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={`${item.type}-${item.url}-${index}`}
              className="group relative aspect-square overflow-hidden border border-border/60 bg-muted/20"
            >
              {item.type === "video" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={item.url}
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={item.url}
                  alt={`מדיה ${index + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              )}

              <div
                className={cn(
                  "absolute inset-x-0 top-0 flex items-center justify-between gap-1 bg-background/80 px-1.5 py-1",
                  "text-[10px] font-light"
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {item.type === "video" ? (
                    <Clapperboard className="h-3 w-3" strokeWidth={1.5} />
                  ) : (
                    <ImagePlus className="h-3 w-3" strokeWidth={1.5} />
                  )}
                  {item.type === "video" ? "וידאו" : "תמונה"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAt(index)}
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  aria-label="הסרת מדיה"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs font-light text-muted-foreground">
          אין מדיה — הוסיפו תמונות או וידאו
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{ maxFiles: 1, multiple: false }}
          onSuccess={(result) => {
            if (
              typeof result.info === "object" &&
              result.info &&
              "secure_url" in result.info
            ) {
              addItem({
                type: "image",
                url: result.info.secure_url as string,
              });
            }
          }}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => open()}
              className="rounded-none text-xs font-light"
            >
              <ImagePlus className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
              הוספת תמונה
            </Button>
          )}
        </CldUploadWidget>

        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{
            maxFiles: 1,
            multiple: false,
            resourceType: "video",
            sources: ["local", "url"],
          }}
          onSuccess={(result) => {
            if (
              typeof result.info === "object" &&
              result.info &&
              "secure_url" in result.info
            ) {
              addItem({
                type: "video",
                url: result.info.secure_url as string,
              });
            }
          }}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => open()}
              className="rounded-none text-xs font-light"
            >
              <Video className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
              הוספת וידאו
            </Button>
          )}
        </CldUploadWidget>
      </div>

      <p className="text-[11px] font-light leading-relaxed text-muted-foreground">
        ניתן להוסיף כמה תמונות וסרטונים שרוצים. וידאו יוצג ראשון בגלריית המוצר.
      </p>
    </div>
  );
}
