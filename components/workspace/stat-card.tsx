import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  href?: string;
};

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  trend,
  href,
}: StatCardProps) {
  const card = (
    <Card
      className={cn(
        "rounded-none border-border/60 shadow-none transition-shadow hover:shadow-md",
        href && "cursor-pointer"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-light tracking-[0.1em] text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.25} />
      </CardHeader>
      <CardContent>
        <p className="font-serif text-3xl font-light tracking-wide">{value}</p>
        {hint && (
          <p
            className={cn(
              "mt-1 text-xs font-light",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-red-600",
              !trend && "text-muted-foreground"
            )}
          >
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
