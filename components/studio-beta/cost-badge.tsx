import { cn } from "@/lib/utils";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import { formatStudioCost } from "@/lib/studio-beta/currency";

export function CostBadge({
  costUsd,
  className,
}: {
  costUsd: number;
  className?: string;
}) {
  const currency = useStudioBetaStore((s) => s.currency);
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
      {isFree ? "חינם" : formatStudioCost(costUsd, currency)}
    </span>
  );
}
