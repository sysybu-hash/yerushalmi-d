import { and, count, desc, eq, gte, inArray, lt, sum } from "drizzle-orm";

import { db } from "@/db";
import { customers, orders, products } from "@/db/schema";

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
});

const PAID_STATUSES = ["paid", "shipped"] as const;

function monthBounds(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return { start, end };
}

function formatTrend(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? "+100% מהחודש הקודם" : "אין נתונים לחודש הקודם";
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% מהחודש הקודם`;
}

function relativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דקות`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "אתמול";
  return `לפני ${days} ימים`;
}

export async function getDashboardStats() {
  const thisMonth = monthBounds();
  const prevMonth = monthBounds(
    new Date(thisMonth.start.getFullYear(), thisMonth.start.getMonth() - 1, 1)
  );

  const [
    inventoryRow,
    openOrdersRow,
    revenueThisMonthRow,
    revenuePrevMonthRow,
    customersThisMonthRow,
    customersPrevMonthRow,
    pendingShipRow,
    recentOrders,
    recentCustomers,
  ] = await Promise.all([
    db.select({ count: count() }).from(products),
    db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "pending")),
    db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, thisMonth.start),
          inArray(orders.status, [...PAID_STATUSES])
        )
      ),
    db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, prevMonth.start),
          lt(orders.createdAt, prevMonth.end),
          inArray(orders.status, [...PAID_STATUSES])
        )
      ),
    db
      .select({ count: count() })
      .from(customers)
      .where(gte(customers.createdAt, thisMonth.start)),
    db
      .select({ count: count() })
      .from(customers)
      .where(
        and(
          gte(customers.createdAt, prevMonth.start),
          lt(customers.createdAt, prevMonth.end)
        )
      ),
    db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "paid")),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5),
    db.select().from(customers).orderBy(desc(customers.createdAt)).limit(3),
  ]);

  const revenueThisMonth = Number(revenueThisMonthRow[0]?.total ?? 0);
  const revenuePrevMonth = Number(revenuePrevMonthRow[0]?.total ?? 0);
  const customersThisMonth = customersThisMonthRow[0]?.count ?? 0;
  const customersPrevMonth = customersPrevMonthRow[0]?.count ?? 0;

  const activity = [
    ...recentOrders.map((order) => ({
      text: `הזמנה #${order.id} — ${order.customerName} (${priceFormatter.format(Number(order.totalAmount))})`,
      time: relativeTime(order.createdAt),
      sortKey: order.createdAt.getTime(),
    })),
    ...recentCustomers.map((customer) => ({
      text: `לקוח/ה חדש/ה — ${customer.fullName}`,
      time: relativeTime(customer.createdAt),
      sortKey: customer.createdAt.getTime(),
    })),
  ]
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, 6)
    .map(({ text, time }) => ({ text, time }));

  return {
    stats: [
      {
        title: "סך הכל הכנסות החודש",
        value: priceFormatter.format(revenueThisMonth),
        hint: formatTrend(revenueThisMonth, revenuePrevMonth),
        trend:
          revenueThisMonth >= revenuePrevMonth
            ? ("up" as const)
            : ("down" as const),
      },
      {
        title: "לקוחות חדשים",
        value: String(customersThisMonth),
        hint: formatTrend(customersThisMonth, customersPrevMonth),
        trend:
          customersThisMonth >= customersPrevMonth
            ? ("up" as const)
            : ("down" as const),
      },
      {
        title: "תכשיטים במלאי",
        value: String(inventoryRow[0]?.count ?? 0),
        hint: "מוצרים פעילים בחנות",
      },
      {
        title: "הזמנות פתוחות",
        value: String(openOrdersRow[0]?.count ?? 0),
        hint: `${pendingShipRow[0]?.count ?? 0} ממתינות למשלוח`,
      },
    ],
    activity:
      activity.length > 0
        ? activity
        : [{ text: "אין פעילות עדיין — ברוכים הבאים!", time: "" }],
  };
}
