import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** יהלום בלבד — PNG שקוף (בלי מלבן שחור) */
export const BRAND_MARK_SRC = "/logo-diamond.png";

const LOGO_SIZES = {
  sm: "h-9 w-9 sm:h-10 sm:w-10",
  md: "h-14 w-14 sm:h-16 sm:w-16",
  lg: "h-24 w-24 sm:h-32 sm:w-32",
  xl: "h-28 w-28 sm:h-36 sm:w-36",
} as const;

const TEXT_SIZES = {
  sm: "text-xs sm:text-sm tracking-[0.12em]",
  md: "text-sm sm:text-base tracking-[0.14em]",
  lg: "text-lg sm:text-xl tracking-[0.16em]",
  xl: "text-xl sm:text-2xl tracking-[0.18em]",
} as const;

export type BrandLogoProps = {
  logoSrc?: string;
  size?: keyof typeof LOGO_SIZES;
  /** שורה אחת: יהלום + טקסט — ל-header קומפקטי בגלילה */
  compact?: boolean;
  /** light = על רקע כהה */
  tone?: "light" | "dark";
  className?: string;
  href?: string;
  priority?: boolean;
};

export function BrandLogo({
  size = "md",
  compact = false,
  tone = "light",
  className,
  href,
  priority = false,
}: BrandLogoProps) {
  const isLight = tone === "light";
  const markSize = compact ? "sm" : size;

  const mark = (
    <span className={cn("relative shrink-0", LOGO_SIZES[markSize])}>
      <Image
        src={BRAND_MARK_SRC}
        alt=""
        aria-hidden
        width={900}
        height={600}
        priority={priority}
        className={cn(
          "h-full w-full object-contain transition-all duration-500",
          isLight
            ? "drop-shadow-[0_0_40px_rgba(34,211,238,0.5)]"
            : "brightness-95 contrast-105"
        )}
      />
    </span>
  );

  const wordmark = (
    <span
      className={cn(
        "font-brand font-medium leading-none whitespace-nowrap transition-all duration-500",
        compact ? TEXT_SIZES.sm : TEXT_SIZES[size],
        isLight ? "text-ivory" : "text-foreground"
      )}
    >
      Yerushalmi Diamonds
    </span>
  );

  const content = compact ? (
    <span className={cn("inline-flex items-center gap-2.5 sm:gap-3", className)}>
      {mark}
      {wordmark}
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex flex-col items-center gap-2.5 text-center sm:gap-3",
        className
      )}
    >
      {mark}
      {wordmark}
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Yerushalmi Diamonds — Home" className="group">
        {content}
      </Link>
    );
  }

  return content;
}
