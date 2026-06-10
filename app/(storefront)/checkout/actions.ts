"use server";

import { inArray } from "drizzle-orm";

import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";

export type CheckoutItem = {
  id: number;
  quantity: number;
};

export type CheckoutCustomer = {
  fullName: string;
  email: string;
  phone: string;
};

/**
 * יצירת הזמנה: המחירים נשלפים מהדאטהבייס (לא מהלקוח!)
 * כדי שלא ניתן יהיה לזייף מחיר בצד הדפדפן.
 */
export async function createOrder(
  customer: CheckoutCustomer,
  items: CheckoutItem[]
) {
  const fullName = customer.fullName?.trim();
  const phone = customer.phone?.trim();
  const email = customer.email?.trim() || null;

  if (!fullName) {
    throw new Error("שם מלא הוא שדה חובה");
  }

  if (!phone) {
    throw new Error("טלפון הוא שדה חובה");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("הסל ריק");
  }

  const productIds = items.map((i) => i.id);
  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  const productById = new Map(dbProducts.map((p) => [p.id, p]));

  // בניית שורות ההזמנה לפי המחיר האמיתי בדאטהבייס
  const lines = items.map((item) => {
    const product = productById.get(item.id);
    if (!product) {
      throw new Error("אחד הפריטים בסל כבר אינו זמין — רעננו את העמוד");
    }
    const quantity = Math.max(1, Math.min(99, Math.trunc(item.quantity)));
    return {
      productId: product.id,
      productTitle: product.title,
      price: product.price,
      quantity,
    };
  });

  const totalAmount = lines.reduce(
    (sum, line) => sum + Number(line.price) * line.quantity,
    0
  );

  const [order] = await db
    .insert(orders)
    .values({
      customerName: fullName,
      customerPhone: phone,
      customerEmail: email,
      totalAmount: totalAmount.toFixed(2),
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    lines.map((line) => ({ ...line, orderId: order.id }))
  );

  return { orderId: order.id };
}
