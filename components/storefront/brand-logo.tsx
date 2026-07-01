import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const LOGO_SIZES = {
  sm: "h-11 w-11 sm:h-12 sm:w-12",
  md: "h-14 w-14 sm:h-[4.25rem] sm:w-[4.25rem]",
  lg: "h-20 w-20 sm:h-24 sm:w-24",
} as const;

const TEXT_SIZES = {
  sm: "text-sm sm:text-base tracking-[0.14em]",
  md: "text-base sm:text-lg tracking-[0.16em]",
  lg: "text-xl sm:text-2xl tracking-[0.18em]",
} as const;

export type BrandLogoProps = {
  logoSrc?: string;
  size?: keyof typeof LOGO_SIZES;
  /** light = על רקע כהה (ivory + gold) */
  tone?: "light" | "dark";
  className?: string;
  href?: string;
  priority?: boolean;
};

export function BrandLogo({
  logoSrc = "/logo-mark.png",
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
        "inline-flex flex-col items-center gap-2 text-center",
        className
      )}
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt="Yerushalmi Diamonds"
          width={96}
          height={96}
          priority={priority}
          className={cn(
            "shrink-0 object-contain drop-shadow-[0_4px_24px_rgba(255,255,255,0.12)]",
            LOGO_SIZES[size]
          )}
        />
      ) : null}
      <span
        className={cn(
          "font-brand font-medium leading-none",
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
