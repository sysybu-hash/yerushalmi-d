import Link from "next/link";
import { desc } from "drizzle-orm";
import { FileText, Printer } from "lucide-react";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { getSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateInvoiceSheet } from "@/components/workspace/create-invoice-sheet";
import { DeleteInvoiceButton } from "@/components/workspace/delete-invoice-button";
import { InvoiceStatusSelect } from "@/components/workspace/invoice-status-select";
import { INVOICE_TYPE_LABELS, type InvoiceType } from "@/components/workspace/invoice-constants";
import { recentOrdersForInvoice } from "./actions";

export const metadata = { title: "חשבוניות" };

export const dynamic = "force-dynamic";

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function InvoicesPage() {
  const [rows, settings, orders] = await Promise.all([
    db.select().from(invoices).orderBy(desc(invoices.createdAt)),
    getSiteSettings(),
    recentOrdersForInvoice(),
  ]);

  const defaultVatRate = Number(settings.invoiceVatRate) || 18;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-wide">
            חשבוניות
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            {rows.length > 0
              ? `${rows.length} חשבוניות במערכת`
              : "הפקת חשבוניות מס וקבלות ללקוחות"}
          </p>
        </div>
        <CreateInvoiceSheet defaultVatRate={defaultVatRate} orders={orders} />
      </div>

      <div className="border border-border/60 bg-background">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <FileText
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={0.75}
            />
            <div>
              <p className="font-serif text-xl font-light">אין חשבוניות עדיין</p>
              <p className="mt-1 text-sm font-light text-muted-foreground">
                לחצו על &quot;חשבונית חדשה&quot; כדי להפיק את הראשונה
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-right font-light">מספר</TableHead>
                <TableHead className="text-right font-light">סוג</TableHead>
                <TableHead className="text-right font-light">לקוח</TableHead>
                <TableHead className="text-right font-light">תאריך</TableHead>
                <TableHead className="text-right font-light">סה״כ</TableHead>
                <TableHead className="text-right font-light">סטטוס</TableHead>
                <TableHead className="text-left font-light">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium tabular-nums" dir="ltr">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-xs font-light text-muted-foreground">
                    {INVOICE_TYPE_LABELS[invoice.type as InvoiceType]}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{invoice.customerName}</p>
                    {invoice.customerPhone && (
                      <p
                        className="mt-0.5 text-xs font-light text-muted-foreground"
                        dir="ltr"
                      >
                        {invoice.customerPhone}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-light tabular-nums">
                    {dateFormatter.format(invoice.issueDate)}
                  </TableCell>
                  <TableCell className="font-light tabular-nums">
                    {priceFormatter.format(Number(invoice.total))}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusSelect
                      invoiceId={invoice.id}
                      status={invoice.status}
                    />
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label="צפייה והדפסה"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Link href={`/workspace/invoices/${invoice.id}`} target="_blank">
                          <Printer aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                        </Link>
                      </Button>
                      <DeleteInvoiceButton
                        id={invoice.id}
                        invoiceNumber={invoice.invoiceNumber}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
