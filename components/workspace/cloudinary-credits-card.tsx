"use client";

import { useEffect, useState } from "react";
import { CloudCog } from "lucide-react";
import { StatCard } from "@/components/workspace/stat-card";

type CloudinaryUsage = {
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  usedPercent: number;
};

/** תצוגת קרדיטים חודשיים של Cloudinary — נטענת פעם אחת, בלי polling */
export function CloudinaryCreditsCard() {
  const [usage, setUsage] = useState<CloudinaryUsage | null>(null);

  useEffect(() => {
    fetch("/api/cloudinary/usage")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setUsage(json.usage);
      })
      .catch(() => {});
  }, []);

  if (!usage) return null;

  const remaining = Math.max(0, usage.creditsLimit - usage.creditsUsed);

  return (
    <StatCard
      title="קרדיטים Cloudinary (חודשי)"
      value={`${remaining.toFixed(1)} מתוך ${usage.creditsLimit}`}
      hint={`נוצלו ${usage.usedPercent.toFixed(0)}% — תוכנית ${usage.plan}`}
      icon={CloudCog}
      trend={usage.usedPercent > 80 ? "down" : undefined}
    />
  );
}
