"use server";

import { desc, eq, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { invoiceItems, invoices, orders } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export type InvoiceItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type CreateInvoiceInput = {
  type: "invoice" | "receipt";
  status: "draft" | "sent" | "paid" | "cancelled";
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerTaxId?: string;
  vatRate: number;
  notes?: string;
  items: InvoiceItemInput[];
  orderId?: number | null;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** מספר חשבונית רץ לפי שנה: 2026-0001 */
async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;

  const rows = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(like(invoices.invoiceNumber, `${prefix}%`));

  let max = 0;
  for (const row of rows) {
    const seq = Number(row.invoiceNumber.slice(prefix.length));
    if (Number.isFinite(seq) && seq > max) max = seq;
  }

  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export async function createInvoice(input: CreateInvoiceInput) {
  await requireAdmin();

  const name = input.customerName?.trim();
  if (!name) {
    throw new Error("שם הלקוח הוא שדה חובה");
  }

  const items = (input.items ?? [])
    .map((item) => ({
      description: item.description?.trim() ?? "",
      quantity: Math.max(1, Math.trunc(Number(item.quantity) || 0)),
      unitPrice: round2(Number(item.unitPrice) || 0),
    }))
    .filter((item) => item.description && item.unitPrice >= 0);

  if (items.length === 0) {
    throw new Error("יש להוסיף לפחות שורת פריט אחת");
  }

  const vatRate = Number(input.vatRate);
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    throw new Error("שיעור מע״מ אינו תקין");
  }

  const lines = items.map((item) => ({
    ...item,
    lineTotal: round2(item.quantity * item.unitPrice),
  }));

  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const vatAmount = round2((subtotal * vatRate) / 100);
  const total = round2(subtotal + vatAmount);

  const invoiceNumber = await nextInvoiceNumber();

  const [created] = await db
    .insert(invoices)
    .values({
      invoiceNumber,
      type: input.type,
      status: input.status,
      customerName: name,
      customerPhone: input.customerPhone?.trim() || null,
      customerEmail: input.customerEmail?.trim() || null,
      customerAddress: input.customerAddress?.trim() || null,
      customerTaxId: input.customerTaxId?.trim() || null,
      subtotal: subtotal.toFixed(2),
      vatRate: vatRate.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2),
      notes: input.notes?.trim() || null,
      orderId: input.orderId ?? null,
    })
    .returning({ id: invoices.id });

  await db.insert(invoiceItems).values(
    lines.map((line) => ({
      invoiceId: created.id,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice.toFixed(2),
      lineTotal: line.lineTotal.toFixed(2),
    }))
  );

  revalidatePath("/workspace/invoices");
  revalidatePath("/workspace");

  return { invoiceId: created.id, invoiceNumber };
}

export async function updateInvoiceStatus(
  id: number,
  status: "draft" | "sent" | "paid" | "cancelled"
) {
  await requireAdmin();
  await db.update(invoices).set({ status }).where(eq(invoices.id, id));
  revalidatePath("/workspace/invoices");
  revalidatePath(`/workspace/invoices/${id}`);
}

export async function deleteInvoice(id: number) {
  await requireAdmin();
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/workspace/invoices");
}

/** טעינת פרטי הזמנה כדי לייצר ממנה חשבונית (פריטים + לקוח) */
export async function loadOrderForInvoice(orderId: number) {
  await requireAdmin();

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });

  if (!order) {
    throw new Error("ההזמנה לא נמצאה");
  }

  return {
    orderId: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    customerAddress: order.deliveryAddress,
    items: order.items.map((item) => ({
      description: item.productTitle,
      quantity: item.quantity,
      unitPrice: Number(item.price),
    })),
  };
}

/** רשימת הזמנות אחרונות לבחירה בעת יצירת חשבונית */
export async function recentOrdersForInvoice() {
  await requireAdmin();
  const rows = await db
    .select({
      id: orders.id,
      customerName: orders.customerName,
      total: orders.totalAmount,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(50);
  return rows;
}
