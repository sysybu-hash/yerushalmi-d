"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Row = { calls: number; costUsd: number };

type AiUsageDashboardProps = {
  year: number;
  month: number;
  ilsRate: number;
  summary: { paidCalls: number; cachedCalls: number; estimatedCostUsd: number };
  comparison: {
    deltaCalls: number | null;
    deltaCost: number | null;
  };
  byProvider: Array<{ provider: string } & Row>;
  byModel: Array<{ modelId: string; provider: string } & Row>;
  byCapability: Array<{ capability: string } & Row>;
  byMode: Array<{ mode: string } & Row>;
  dailyTrend: Array<{ day: string } & Row>;
};

function monthLink(year: number, month: number) {
  return `/workspace/ai-usage?year=${year}&month=${month}`;
}

function formatPct(value: number | null) {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-light">
        <thead>
          <tr className="border-b border-border/60 text-right text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 font-light">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/30">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AiUsageDashboard({
  year,
  month,
  ilsRate,
  summary,
  comparison,
  byProvider,
  byModel,
  byCapability,
  byMode,
  dailyTrend,
}: AiUsageDashboardProps) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const costIls = summary.estimatedCostUsd * ilsRate;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm font-light">
        <Link href={monthLink(prevYear, prevMonth)} className="text-gold-dark underline">
          ← חודש קודם
        </Link>
        <span className="text-muted-foreground">
          {month}/{year}
        </span>
        <Link href={monthLink(nextYear, nextMonth)} className="text-gold-dark underline">
          חודש הבא →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-none border-border/60 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>קריאות בתשלום</CardDescription>
            <CardTitle className="text-2xl font-light">{summary.paidCalls}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            לעומת חודש קודם: {formatPct(comparison.deltaCalls)}
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/60 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>עלות משוערת</CardDescription>
            <CardTitle className="text-2xl font-light">
              ${summary.estimatedCostUsd.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            ≈ ₪{costIls.toFixed(0)} · {formatPct(comparison.deltaCost)} לחודש קודם
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/60 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>חיסכון מ-cache</CardDescription>
            <CardTitle className="text-2xl font-light">{summary.cachedCalls}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            cutout / וריאנטים ללא API נוסף
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/60 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>ממוצע לקריאה</CardDescription>
            <CardTitle className="text-2xl font-light">
              $
              {summary.paidCalls > 0
                ? (summary.estimatedCostUsd / summary.paidCalls).toFixed(3)
                : "0"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-none border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-light">לפי מנוע</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              headers={["מנוע", "קריאות", "$ משוער"]}
              rows={byProvider.map((r) => [
                r.provider,
                r.calls,
                r.costUsd.toFixed(3),
              ])}
            />
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-light">לפי יכולת</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              headers={["יכולת", "קריאות", "$ משוער"]}
              rows={byCapability.map((r) => [
                r.capability,
                r.calls,
                r.costUsd.toFixed(3),
              ])}
            />
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/60 shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-light">לפי מודל</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              headers={["מודל", "מנוע", "קריאות", "$ משוער"]}
              rows={byModel.map((r) => [
                r.modelId,
                r.provider,
                r.calls,
                r.costUsd.toFixed(3),
              ])}
            />
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-light">לפי מצב</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              headers={["מצב", "קריאות", "$ משוער"]}
              rows={byMode.map((r) => [r.mode, r.calls, r.costUsd.toFixed(3)])}
            />
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-light">מגמה יומית</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              headers={["יום", "קריאות", "$ משוער"]}
              rows={dailyTrend.map((r) => [
                r.day,
                r.calls,
                r.costUsd.toFixed(3),
              ])}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
