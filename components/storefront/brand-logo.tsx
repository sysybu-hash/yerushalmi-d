import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** יהלום בלבד — PNG שקוף (בלי מלבן שחור) */
export const BRAND_MARK_SRC = "/logo-diamond.png";

const LOGO_SIZES = {
  sm: "h-14 w-14",
  md: "h-20 w-20 sm:h-24 sm:w-24",
  lg: "h-28 w-28 sm:h-36 sm:w-36",
  xl: "h-32 w-32 sm:h-44 sm:w-44",
  "2xl": "h-36 w-36 sm:h-[12rem] sm:w-[12rem]",
} as const;

const TEXT_SIZES = {
  sm: "text-sm tracking-[0.12em]",
  md: "text-base sm:text-lg tracking-[0.14em]",
  lg: "text-lg sm:text-xl tracking-[0.16em]",
  xl: "text-xl sm:text-2xl tracking-[0.18em]",
  "2xl": "text-xl sm:text-2xl tracking-[0.2em]",
} as const;

export type BrandLogoProps = {
  /** נשמר לתאימות — המיתוג משתמש תמיד ב-BRAND_MARK_SRC */
  logoSrc?: string;
  size?: keyof typeof LOGO_SIZES;
  /** light = על רקע כהה (screen מסתיר שחור) */
  tone?: "light" | "dark";
  className?: string;
  href?: string;
  priority?: boolean;
};

export function BrandLogo({
  size = "md",
  tone = "light",
  className,
  href,
  priority = false,
}: BrandLogoProps) {
  const isLight = tone === "light";

  const content = (
    <span
      className={cn(
        "inline-flex flex-col items-center gap-3 text-center sm:gap-3.5",
        className
      )}
    >
      <span className={cn("relative shrink-0", LOGO_SIZES[size])}>
        <Image
          src={BRAND_MARK_SRC}
          alt=""
          aria-hidden
          width={900}
          height={600}
          priority={priority}
          className={cn(
            "h-full w-full object-contain",
            isLight &&
              "drop-shadow-[0_0_48px_rgba(34,211,238,0.55)]",
            !isLight && "brightness-95 contrast-105"
          )}
        />
      </span>
      <span
        className={cn(
          "font-brand font-medium leading-none whitespace-nowrap",
          TEXT_SIZES[size],
          isLight ? "text-ivory" : "text-foreground"
        )}
      >
        Yerushalmi Diamonds
      </span>
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
