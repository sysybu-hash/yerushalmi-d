"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orders } from "@/db/schema";
import {
  ORDER_STATUSES,
  type OrderStatus,
} from "@/components/workspace/order-constants";

/** שליפת כל ההזמנות כולל הפריטים שלהן, מהחדש לישן */
export async function getOrders() {
  return db.query.orders.findMany({
    with: { items: true },
    orderBy: desc(orders.createdAt),
  });
}

/** עדכון סטטוס הזמנה */
export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatus
) {
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
