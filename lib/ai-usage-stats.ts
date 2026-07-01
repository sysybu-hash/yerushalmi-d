import { db } from "@/db";
import { aiUsageEvents } from "@/db/schema";
import { and, count, eq, gte, lt, sql, sum } from "drizzle-orm";

export type MonthBounds = { start: Date; end: Date };

export function monthBounds(year: number, month: number): MonthBounds {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function monthWhere(bounds: MonthBounds) {
  return and(
    gte(aiUsageEvents.createdAt, bounds.start),
    lt(aiUsageEvents.createdAt, bounds.end)
  );
}

export async function getUsageMonthSummary(year: number, month: number) {
  const bounds = monthBounds(year, month);
  const where = monthWhere(bounds);

  const [paidRow, cachedRow, costRow] = await Promise.all([
    db
      .select({ total: count() })
      .from(aiUsageEvents)
      .where(
        and(where, eq(aiUsageEvents.cached, false), eq(aiUsageEvents.success, true))
      ),
    db
      .select({ total: count() })
      .from(aiUsageEvents)
      .where(and(where, eq(aiUsageEvents.cached, true))),
    db
      .select({ total: sum(aiUsageEvents.estimatedCostUsd) })
      .from(aiUsageEvents)
      .where(and(where, eq(aiUsageEvents.cached, false))),
  ]);

  return {
    paidCalls: paidRow[0]?.total ?? 0,
    cachedCalls: cachedRow[0]?.total ?? 0,
    estimatedCostUsd: Number(costRow[0]?.total ?? 0),
  };
}

export async function getUsageBreakdownByProvider(year: number, month: number) {
  const bounds = monthBounds(year, month);
  return db
    .select({
      provider: aiUsageEvents.provider,
      calls: count(),
      costUsd: sum(aiUsageEvents.estimatedCostUsd),
    })
    .from(aiUsageEvents)
    .where(and(monthWhere(bounds), eq(aiUsageEvents.cached, false)))
    .groupBy(aiUsageEvents.provider);
}

export async function getUsageBreakdownByModel(year: number, month: number) {
  const bounds = monthBounds(year, month);
  return db
    .select({
      modelId: aiUsageEvents.modelId,
      provider: aiUsageEvents.provider,
      calls: count(),
      costUsd: sum(aiUsageEvents.estimatedCostUsd),
    })
    .from(aiUsageEvents)
    .where(and(monthWhere(bounds), eq(aiUsageEvents.cached, false)))
    .groupBy(aiUsageEvents.modelId, aiUsageEvents.provider)
    .orderBy(sql`count(*) desc`);
}

export async function getUsageBreakdownByCapability(year: number, month: number) {
  const bounds = monthBounds(year, month);
  return db
    .select({
      capability: aiUsageEvents.capability,
      calls: count(),
      costUsd: sum(aiUsageEvents.estimatedCostUsd),
    })
    .from(aiUsageEvents)
    .where(and(monthWhere(bounds), eq(aiUsageEvents.cached, false)))
    .groupBy(aiUsageEvents.capability);
}

export async function getUsageBreakdownByMode(year: number, month: number) {
  const bounds = monthBounds(year, month);
  return db
    .select({
      mode: aiUsageEvents.mode,
      calls: count(),
      costUsd: sum(aiUsageEvents.estimatedCostUsd),
    })
    .from(aiUsageEvents)
    .where(and(monthWhere(bounds), eq(aiUsageEvents.cached, false)))
    .groupBy(aiUsageEvents.mode);
}

export async function getDailyUsageTrend(year: number, month: number) {
  const bounds = monthBounds(year, month);
  return db
    .select({
      day: sql<string>`date_trunc('day', ${aiUsageEvents.createdAt})::date`,
      calls: count(),
      costUsd: sum(aiUsageEvents.estimatedCostUsd),
    })
    .from(aiUsageEvents)
    .where(and(monthWhere(bounds), eq(aiUsageEvents.cached, false)))
    .groupBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`)
    .orderBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`);
}

export async function compareToPreviousMonth(year: number, month: number) {
  const current = await getUsageMonthSummary(year, month);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const previous = await getUsageMonthSummary(prevYear, prevMonth);

  const deltaCalls =
    previous.paidCalls === 0
      ? null
      : ((current.paidCalls - previous.paidCalls) / previous.paidCalls) * 100;
  const deltaCost =
    previous.estimatedCostUsd === 0
      ? null
      : ((current.estimatedCostUsd - previous.estimatedCostUsd) /
          previous.estimatedCostUsd) *
        100;

  return { current, previous, deltaCalls, deltaCost };
}
