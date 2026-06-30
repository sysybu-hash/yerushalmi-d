"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ProductCarouselProps = {
  children: React.ReactNode;
  className?: string;
};

export function ProductCarousel({ children, className }: ProductCarouselProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = React.useState(false);
  const [canScrollForward, setCanScrollForward] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 4) {
      setCanScrollBack(false);
      setCanScrollForward(false);
      return;
    }

    const position = Math.abs(track.scrollLeft);
    setCanScrollBack(position > 4);
    setCanScrollForward(position < maxScroll - 4);
  }, []);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollState();

    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, children]);

  function scrollByPage(direction: "back" | "forward") {
    const track = trackRef.current;
    if (!track) return;

    const step = Math.max(track.clientWidth * 0.82, 280);
    const delta = direction === "forward" ? -step : step;

    track.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <div className={cn("relative fade-up mt-14", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="גלילה אחורה"
        disabled={!canScrollBack}
        onClick={() => scrollByPage("back")}
        className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 rounded-full border-border/60 bg-background/95 shadow-md backdrop-blur-sm disabled:opacity-30 sm:flex"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="גלילה קדימה"
        disabled={!canScrollForward}
        onClick={() => scrollByPage("forward")}
        className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 rounded-full border-border/60 bg-background/95 shadow-md backdrop-blur-sm disabled:opacity-30 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
      </Button>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

export function ProductCarouselItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-[72vw] shrink-0 snap-start sm:w-[280px] lg:w-[300px]",
        className
      )}
    >
      {children}
    </div>
  );
}
