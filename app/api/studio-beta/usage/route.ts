import { NextResponse } from "next/server";
import { and, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsageEvents } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, error: "פג תוקף ההתחברות — התחברו מחדש דרך /login" },
      { status: 401 }
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      id: aiUsageEvents.id,
      capability: aiUsageEvents.capability,
      modelId: aiUsageEvents.modelId,
      estimatedCostUsd: aiUsageEvents.estimatedCostUsd,
      cached: aiUsageEvents.cached,
      createdAt: aiUsageEvents.createdAt,
    })
    .from(aiUsageEvents)
    .where(
      and(
        sql`${aiUsageEvents.metadata} ->> 'app' = 'studio-beta'`,
        gte(aiUsageEvents.createdAt, startOfDay)
      )
    )
    .orderBy(aiUsageEvents.createdAt);

  const totalUsd = rows.reduce(
    (sum, row) => sum + Number(row.estimatedCostUsd ?? 0),
    0
  );

  return NextResponse.json({ ok: true, totalUsd, events: rows });
}
