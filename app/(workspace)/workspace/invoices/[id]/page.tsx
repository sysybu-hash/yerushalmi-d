import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { getSiteSettings } from "@/lib/site-settings";
import { PrintButton } from "@/components/workspace/print-button";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  type InvoiceStatus,
  type InvoiceType,
} from "@/components/workspace/invoice-constants";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const metadata = { title: "חשבונית" };

type InvoicePageProps = { params: { id: string } };

export default async function InvoiceDetailPage({ params }: InvoicePageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [invoice, settings] = await Promise.all([
    db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: { items: true },
    }),
    getSiteSettings(),
  ]);

  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-serif text-2xl font-light tracking-wide">
          חשבונית {invoice.invoiceNumber}
        </h1>
        <PrintButton />
      </div>

      <article className="border border-border/60 bg-white p-8 text-[14px] text-stone-900 sm:p-12 print:border-0 print:p-0">
        {/* כותרת */}
        <header className="flex items-start justify-between gap-6 border-b border-stone-200 pb-6">
          <div>
            <p className="font-serif text-2xl font-medium tracking-wide">
              {settings.businessName}
            </p>
            {settings.businessId && (
              <p className="mt-1 text-xs text-stone-500">
                ע.מ / ח.פ: {settings.businessId}
              </p>
            )}
            {settings.businessAddress && (
              <p className="text-xs text-stone-500">{settings.businessAddress}</p>
            )}
            <p className="text-xs text-stone-500" dir="ltr">
              {settings.contactPhone}
            </p>
          </div>
          <div className="text-left">
            <p className="text-lg font-medium">
              {INVOICE_TYPE_LABELS[invoice.type as InvoiceType]}
            </p>
            <p className="mt-1 text-sm tabular-nums" dir="ltr">
              {invoice.invoiceNumber}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              תאריך: {dateFormatter.format(invoice.issueDate)}
            </p>
            <p className="text-xs text-stone-500">
              סטטוס: {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus]}
            </p>
          </div>
        </header>

        {/* פרטי לקוח */}
        <section className="border-b border-stone-200 py-5">
          <p className="text-xs uppercase tracking-wide text-stone-400">לכבוד</p>
          <p className="mt-1 text-base font-medium">{invoice.customerName}</p>
          {invoice.customerTaxId && (
            <p className="text-xs text-stone-500">ח.פ / ת.ז: {invoice.customerTaxId}</p>
          )}
          {invoice.customerAddress && (
            <p className="text-xs text-stone-500">{invoice.customerAddress}</p>
          )}
          {invoice.customerPhone && (
            <p className="text-xs text-stone-500" dir="ltr">
              {invoice.customerPhone}
            </p>
          )}
          {invoice.customerEmail && (
            <p className="text-xs text-stone-500" dir="ltr">
              {invoice.customerEmail}
            </p>
          )}
        </section>

        {/* פריטים */}
        <table className="mt-5 w-full border-collapse text-right">
          <thead>
            <tr className="border-b-2 border-stone-300 text-xs text-stone-500">
              <th className="py-2 font-normal">תיאור</th>
              <th className="py-2 text-center font-normal">כמות</th>
              <th className="py-2 text-left font-normal">מחיר ליח׳</th>
              <th className="py-2 text-left font-normal">סה״כ</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-stone-100">
                <td className="py-2.5">{item.description}</td>
                <td className="py-2.5 text-center tabular-nums">
                  {item.quantity}
                </td>
                <td className="py-2.5 text-left tabular-nums">
                  {money.format(Number(item.unitPrice))}
                </td>
                <td className="py-2.5 text-left tabular-nums">
                  {money.format(Number(item.lineTotal))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* סיכום */}
        <div className="mt-5 flex justify-start">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">סכום ביניים</span>
              <span className="tabular-nums">
                {money.format(Number(invoice.subtotal))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">
                מע״מ ({Number(invoice.vatRate)}%)
              </span>
              <span className="tabular-nums">
                {money.format(Number(invoice.vatAmount))}
              </span>
            </div>
            <div className="flex justify-between border-t border-stone-300 pt-2 text-base font-semibold">
              <span>סה״כ לתשלום</span>
              <span className="tabular-nums">
                {money.format(Number(invoice.total))}
              </span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <section className="mt-6 border-t border-stone-200 pt-4 text-xs text-stone-600">
            <p className="font-medium">הערות</p>
            <p className="mt-1 whitespace-pre-line">{invoice.notes}</p>
          </section>
        )}

        {settings.invoiceFooterNote && (
          <footer className="mt-8 border-t border-stone-200 pt-4 text-center text-xs text-stone-400">
            {settings.invoiceFooterNote}
          </footer>
        )}
      </article>
    </div>
  );
}
