"use server";

import { and, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orders } from "@/db/schema";
import {
  ORDER_STATUSES,
  type OrderStatus,
} from "@/components/workspace/order-constants";
import { requireAdmin } from "@/lib/auth";

export type OrderFilters = {
  status?: string;
  q?: string;
};

/** שליפת הזמנות עם סינון וחיפוש */
export async function getOrders(filters?: OrderFilters) {
  await requireAdmin();

  const conditions = [];

  const status = filters?.status?.trim();
  if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
    conditions.push(eq(orders.status, status as OrderStatus));
  }

  const q = filters?.q?.trim();
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(orders.customerName, pattern),
        ilike(orders.customerPhone, pattern),
        ilike(orders.customerEmail, pattern)
      )
    );
  }

  return db.query.orders.findMany({
    with: { items: true },
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(orders.createdAt),
  });
}

/** עדכון סטטוס הזמנה */
export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatus
) {
  await requireAdmin();

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error("מזהה הזמנה לא תקין");
  }

  if (!ORDER_STATUSES.includes(newStatus)) {
    throw new Error("סטטוס לא תקין");
  }

  const [updated] = await db
    .update(orders)
    .set({ status: newStatus })
    .where(eq(orders.id, orderId))
    .returning({ id: orders.id });

  if (!updated) {
    throw new Error("ההזמנה לא נמצאה");
  }

  revalidatePath("/workspace/orders");
}

/** עדכון הערות מנהל להזמנה */
export async function updateAdminNotes(orderId: number, formData: FormData) {
  await requireAdmin();

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error("מזהה הזמנה לא תקין");
  }

  const adminNotes = formData.get("admin_notes")?.toString().trim() || null;

  const [updated] = await db
    .update(orders)
    .set({ adminNotes })
    .where(eq(orders.id, orderId))
    .returning({ id: orders.id });

  if (!updated) {
    throw new Error("ההזמנה לא נמצאה");
  }

  revalidatePath("/workspace/orders");
}
