"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";

/** תצוגת before/after — לחצו והחזיקו כדי לראות את התמונה המקורית */
export function CompareToggle({
  originalUrl,
  resultUrl,
  alt,
}: {
  originalUrl: string;
  resultUrl: string;
  alt: string;
}) {
  const [showingOriginal, setShowingOriginal] = useState(false);

  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={showingOriginal ? originalUrl : resultUrl}
        alt={alt}
        className="max-h-[420px] w-full select-none object-contain"
        draggable={false}
      />
      <button
        type="button"
        onPointerDown={() => setShowingOriginal(true)}
        onPointerUp={() => setShowingOriginal(false)}
        onPointerLeave={() => setShowingOriginal(false)}
        className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 border border-border/60 bg-background/90 px-2.5 py-1 text-[11px] font-light tracking-wide text-muted-foreground backdrop-blur"
      >
        <ArrowLeftRight className="h-3 w-3" strokeWidth={1.5} />
        לחצו והחזיקו: לפני / אחרי
      </button>
    </div>
  );
}
