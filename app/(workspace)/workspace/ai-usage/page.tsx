import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AiUsageDashboard } from "@/components/workspace/ai-usage-dashboard";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import {
  compareToPreviousMonth,
  getDailyUsageTrend,
  getUsageBreakdownByCapability,
  getUsageBreakdownByMode,
  getUsageBreakdownByModel,
  getUsageBreakdownByProvider,
  getUsageMonthSummary,
} from "@/lib/ai-usage-stats";

export const metadata = { title: "עלויות AI — שימושים" };

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function AiUsagePage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const settings = await getSiteSettings();
  const ilsRate = Number(settings.studioUsdToIlsRate) || 3.7;

  const [
    summary,
    comparison,
    byProvider,
    byModel,
    byCapability,
    byMode,
    dailyTrend,
  ] = await Promise.all([
    getUsageMonthSummary(year, month),
    compareToPreviousMonth(year, month),
    getUsageBreakdownByProvider(year, month),
    getUsageBreakdownByModel(year, month),
    getUsageBreakdownByCapability(year, month),
    getUsageBreakdownByMode(year, month),
    getDailyUsageTrend(year, month),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-wide">
            עלויות AI — שימושים
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            פילוח לפי חודש, מנוע ומודל — הערכת עלות, לא חשבונית רשמית
          </p>
        </div>
        <Button variant="outline" asChild className="rounded-none">
          <Link href="/workspace/settings">
            <ArrowLeft className="ml-2 h-4 w-4" />
            הגדרות ומכסות
          </Link>
        </Button>
      </div>

      <AiUsageDashboard
        year={year}
        month={month}
        ilsRate={ilsRate}
        summary={summary}
        comparison={comparison}
        byProvider={byProvider.map((r) => ({
          provider: r.provider,
          calls: r.calls,
          costUsd: Number(r.costUsd ?? 0),
        }))}
        byModel={byModel.map((r) => ({
          modelId: r.modelId,
          provider: r.provider,
          calls: r.calls,
          costUsd: Number(r.costUsd ?? 0),
        }))}
        byCapability={byCapability.map((r) => ({
          capability: r.capability,
          calls: r.calls,
          costUsd: Number(r.costUsd ?? 0),
        }))}
        byMode={byMode.map((r) => ({
          mode: r.mode,
          calls: r.calls,
          costUsd: Number(r.costUsd ?? 0),
        }))}
        dailyTrend={dailyTrend.map((r) => ({
          day: String(r.day),
          calls: r.calls,
          costUsd: Number(r.costUsd ?? 0),
        }))}
      />
    </div>
  );
}
