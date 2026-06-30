"use client";

import * as React from "react";
import Image from "next/image";
import { Gem } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  resolveProductMedia,
  type ProductMediaItem,
} from "@/lib/product-media";

type ProductImagesProps = {
  title: string;
  imageUrl: string | null;
  secondaryImageUrl?: string | null;
  videoUrl?: string | null;
  mediaGallery?: ProductMediaItem[] | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** כרטיס מוצר — החלפה ב-hover; דף מוצר — גלריה עם נקודות */
  variant?: "card" | "gallery";
};

export function ProductImages({
  title,
  imageUrl,
  secondaryImageUrl = null,
  videoUrl = null,
  mediaGallery = null,
  sizes,
  priority = false,
  className,
  variant = "card",
}: ProductImagesProps) {
  const items = resolveProductMedia({
    imageUrl,
    secondaryImageUrl,
    videoUrl,
    mediaGallery,
  });
  const images = items.filter((item) => item.type === "image");
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted",
          className
        )}
      >
        <Gem
          aria-hidden
          className="h-8 w-8 text-gold/50"
          strokeWidth={0.75}
        />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("relative h-full w-full", className)}>
        <Image
          src={images[0]?.url ?? items[0].url}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            "object-cover transition-all duration-500",
            images[1]
              ? "group-hover:scale-105 group-hover:opacity-0"
              : "group-hover:scale-110"
          )}
        />
        {images[1] ? (
          <Image
            src={images[1].url}
            alt={`${title} — תמונה נוספת`}
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
          />
        ) : null}
      </div>
    );
  }

  const active = items[activeIndex] ?? items[0];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
        {active.type === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            key={active.url}
            src={active.url}
            controls
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={active.url}
            alt={title}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover"
          />
        )}
      </div>

      {items.length > 1 ? (
        <div className="flex justify-center gap-2 overflow-x-auto pb-1">
          {items.map((item, index) => (
            <button
              key={`${item.type}-${item.url}`}
              type="button"
              aria-label={
                item.type === "video"
                  ? `וידאו ${index + 1}`
                  : `תמונה ${index + 1}`
              }
              aria-pressed={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden border transition-colors",
                activeIndex === index
                  ? "border-gold"
                  : "border-border/60 opacity-70 hover:opacity-100"
              )}
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
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
