"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { customers, orderItems, orders, products } from "@/db/schema";

export type CheckoutItem = {
  id: number;
  quantity: number;
};

export type CheckoutCustomer = {
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
};

async function upsertCustomer(fullName: string, email: string | null, phone: string) {
  if (email) {
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    if (existing[0]) {
      await db
        .update(customers)
        .set({ fullName, phone })
        .where(eq(customers.id, existing[0].id));
      return;
    }
  }

  const byPhone = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .limit(1);

  if (byPhone[0]) {
    await db
      .update(customers)
      .set({ fullName, email: email ?? byPhone[0].email })
      .where(eq(customers.id, byPhone[0].id));
    return;
  }

  await db.insert(customers).values({
    fullName,
    email,
    phone,
  });

  revalidatePath("/workspace/customers");
}

/**
 * יצירת הזמנה: המחירים נשלפים מהדאטהבייס (לא מהלקוח!)
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

  await upsertCustomer(fullName, email, phone);

  revalidatePath("/workspace/orders");
  revalidatePath("/workspace");

  return { orderId: order.id };
}
