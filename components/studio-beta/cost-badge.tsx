import { cn } from "@/lib/utils";

export function CostBadge({
  costUsd,
  className,
}: {
  costUsd: number;
  className?: string;
}) {
  const isFree = costUsd <= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-[11px] font-light tracking-wide",
        isFree
          ? "border-border/60 text-muted-foreground"
          : "border-gold/40 text-gold-dark",
        className
      )}
    >
      {isFree ? "חינם" : `$${costUsd.toFixed(3)}`}
    </span>
  );
}
