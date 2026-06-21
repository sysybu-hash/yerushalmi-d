"use server";

import { and, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import {
  ORDER_STATUSES,
  type OrderStatus,
} from "@/components/workspace/order-constants";
import { requireAdmin } from "@/lib/auth";

export type OrderFilters = {
  status?: string;
  q?: string;
};

export type OrderWithMatch = Awaited<
  ReturnType<typeof getOrders>
>[number];

/** שליפת הזמנות עם סינון, חיפוש וקישור ללקוח תואם (טלפון/אימייל) */
export async function getOrders(filters?: OrderFilters) {
  await requireAdmin();

  const conditions = [];

  const status = filters?.status?.trim();
  if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
    conditions.push(eq(orders.status, status as OrderStatus));
  }

  const q = filters?.q?.trim();
  if (q) {
    const orderIdMatch = q.replace(/^#/, "");
    if (/^\d+$/.test(orderIdMatch)) {
      conditions.push(eq(orders.id, Number(orderIdMatch)));
    } else {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(orders.customerName, pattern),
          ilike(orders.customerPhone, pattern),
          ilike(orders.customerEmail, pattern)
        )
      );
    }
  }

  const [orderList, customerRows] = await Promise.all([
    db.query.orders.findMany({
      with: { items: true },
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(orders.createdAt),
    }),
    db
      .select({
        id: customers.id,
        email: customers.email,
        phone: customers.phone,
      })
      .from(customers),
  ]);

  const byEmail = new Map<string, number>();
  const byPhone = new Map<string, number>();
  for (const customer of customerRows) {
    if (customer.email) {
      byEmail.set(customer.email.toLowerCase(), customer.id);
    }
    if (customer.phone) {
      byPhone.set(customer.phone, customer.id);
    }
  }

  return orderList.map((order) => {
    let matchedCustomerId: number | null = null;
    if (order.customerEmail) {
      matchedCustomerId =
        byEmail.get(order.customerEmail.toLowerCase()) ?? null;
    }
    if (!matchedCustomerId && order.customerPhone) {
      matchedCustomerId = byPhone.get(order.customerPhone) ?? null;
    }

    return {
      ...order,
      matchedCustomerId,
    };
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
