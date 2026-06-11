"use client";

import * as React from "react";
import Image from "next/image";
import { Gem } from "lucide-react";

import { cn } from "@/lib/utils";

type ProductImagesProps = {
  title: string;
  imageUrl: string | null;
  secondaryImageUrl?: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** כרטיס מוצר — החלפה ב-hover; דף מוצר — גaleria עם נקודות */
  variant?: "card" | "gallery";
};

export function ProductImages({
  title,
  imageUrl,
  secondaryImageUrl = null,
  sizes,
  priority = false,
  className,
  variant = "card",
}: ProductImagesProps) {
  const images = [imageUrl, secondaryImageUrl].filter(
    (url): url is string => Boolean(url)
  );
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (images.length === 0) {
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
          src={images[0]}
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
            src={images[1]}
            alt={`${title} — תמונה נוספת`}
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
          />
        ) : null}
      </div>
    );
  }

  const active = images[activeIndex] ?? images[0];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
        <Image
          src={active}
          alt={title}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="flex justify-center gap-2">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`תמונה ${index + 1}`}
              aria-pressed={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 overflow-hidden border transition-colors",
                activeIndex === index
                  ? "border-gold"
                  : "border-border/60 opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
