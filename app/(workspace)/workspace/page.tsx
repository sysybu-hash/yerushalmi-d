import { Gem, ShoppingBag, TrendingUp, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/workspace/stat-card";
import { CloudinaryCreditsCard } from "@/components/workspace/cloudinary-credits-card";
import { getDashboardStats } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const STAT_ICONS = [TrendingUp, Users, Gem, ShoppingBag] as const;

const STAT_HREFS = [
  "/workspace/orders",
  "/workspace/customers",
  "/workspace/products",
  "/workspace/orders?status=pending",
] as const;

export default async function WorkspaceDashboardPage() {
  const { stats, activity } = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light tracking-wide">
          לוח בקרה
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          סקירה כללית של פעילות החנות — ירושלמי יהלומים
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            icon={STAT_ICONS[index] ?? TrendingUp}
            href={STAT_HREFS[index]}
          />
        ))}
        <CloudinaryCreditsCard />
      </div>

      <Card className="rounded-none border-border/60 shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-light tracking-wide">
            פעילות אחרונה
          </CardTitle>
          <CardDescription className="font-light">
            עדכונים אחרונים מהחנות ומהלקוחות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60">
            {activity.map((item) => (
              <li
                key={item.text}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="text-sm font-light">{item.text}</span>
                {item.time && (
                  <span className="shrink-0 text-xs font-light text-muted-foreground">
                    {item.time}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
