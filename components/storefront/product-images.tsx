"use client";

import * as React from "react";
import Image from "next/image";
import { Clapperboard, Gem, Play } from "lucide-react";

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

function VideoThumbnail({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center bg-charcoal/25",
        className
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm">
        <Play className="h-4 w-4 fill-current pr-0.5" aria-hidden />
      </span>
      <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-sm bg-charcoal/75 px-1.5 py-0.5 text-[9px] font-light tracking-wide text-white">
        <Clapperboard className="h-2.5 w-2.5" aria-hidden />
        וידאו
      </span>
    </div>
  );
}

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
    const cover = images[0] ?? items.find((item) => item.type === "image");
    const hover = images[1];
    const hasVideo = items.some((item) => item.type === "video");

    return (
      <div className={cn("relative h-full w-full", className)}>
        {cover ? (
          <Image
            src={cover.url}
            alt={title}
            fill
            sizes={sizes}
            priority={priority}
            className={cn(
              "object-cover transition-all duration-500",
              hover
                ? "group-hover:scale-105 group-hover:opacity-0"
                : "group-hover:scale-110"
            )}
          />
        ) : null}
        {hover ? (
          <Image
            src={hover.url}
            alt={`${title} — תמונה נוספת`}
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
          />
        ) : null}
        {hasVideo && (
          <VideoThumbnail className="opacity-100 transition-opacity group-hover:opacity-90" />
        )}
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
            className="h-full w-full object-contain"
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
                <>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    src={item.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <VideoThumbnail />
                </>
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
