"use client";

import * as React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  createInvoice,
  loadOrderForInvoice,
} from "@/app/(workspace)/workspace/invoices/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPES,
  INVOICE_TYPE_LABELS,
  type InvoiceStatus,
  type InvoiceType,
} from "@/components/workspace/invoice-constants";

type LineItem = { description: string; quantity: string; unitPrice: string };

type OrderOption = { id: number; customerName: string; total: string };

const money = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 2,
});

const emptyItem: LineItem = { description: "", quantity: "1", unitPrice: "" };

export function CreateInvoiceSheet({
  defaultVatRate,
  orders,
}: {
  defaultVatRate: number;
  orders: OrderOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const [type, setType] = React.useState<InvoiceType>("invoice");
  const [status, setStatus] = React.useState<InvoiceStatus>("draft");
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [customerAddress, setCustomerAddress] = React.useState("");
  const [customerTaxId, setCustomerTaxId] = React.useState("");
  const [vatRate, setVatRate] = React.useState(String(defaultVatRate));
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState<LineItem[]>([{ ...emptyItem }]);
  const [orderId, setOrderId] = React.useState<number | null>(null);

  function reset() {
    setType("invoice");
    setStatus("draft");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setCustomerTaxId("");
    setVatRate(String(defaultVatRate));
    setNotes("");
    setItems([{ ...emptyItem }]);
    setOrderId(null);
    setError(null);
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function addRow() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeRow(index: number) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  }

  async function importFromOrder(value: string) {
    const id = Number(value);
    setError(null);
    try {
      const data = await loadOrderForInvoice(id);
      setOrderId(data.orderId);
      setCustomerName(data.customerName);
      setCustomerPhone(data.customerPhone ?? "");
      setCustomerEmail(data.customerEmail ?? "");
      setCustomerAddress(data.customerAddress ?? "");
      setItems(
        data.items.map((item) => ({
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "טעינת ההזמנה נכשלה");
    }
  }

  const subtotal = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const rate = Number(vatRate) || 0;
  const vatAmount = (subtotal * rate) / 100;
  const total = subtotal + vatAmount;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(true);
    createInvoice({
      type,
      status,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerTaxId,
      vatRate: rate,
      notes,
      orderId,
      items: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      })),
    })
      .then(() => {
        setOpen(false);
        reset();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "ההפקה נכשלה");
      })
      .finally(() => startTransition(false));
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <SheetTrigger asChild>
        <Button className="rounded-none text-xs font-light tracking-[0.15em]">
          <Plus aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
          חשבונית חדשה
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="text-right">
          <SheetTitle className="font-serif text-2xl font-light tracking-wide">
            חשבונית חדשה
          </SheetTitle>
          <SheetDescription className="font-light">
            מספר החשבונית מוקצה אוטומטית לפי השנה
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {orders.length > 0 && (
            <div className="space-y-2 border border-border/50 bg-muted/30 p-3">
              <Label className="text-xs font-light text-muted-foreground">
                ייבוא מהזמנה קיימת (אופציונלי)
              </Label>
              <Select dir="rtl" onValueChange={importFromOrder}>
                <SelectTrigger className="rounded-none bg-background">
                  <SelectValue placeholder="בחרו הזמנה למילוי אוטומטי" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={String(order.id)}>
                      #{order.id} · {order.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-light">סוג מסמך</Label>
              <Select
                dir="rtl"
                value={type}
                onValueChange={(v) => setType(v as InvoiceType)}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {INVOICE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-light">סטטוס</Label>
              <Select
                dir="rtl"
                value={status}
                onValueChange={(v) => setStatus(v as InvoiceStatus)}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {INVOICE_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-name" className="font-light">
                שם הלקוח *
              </Label>
              <Input
                id="inv-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="rounded-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-phone" className="font-light">
                  טלפון
                </Label>
                <Input
                  id="inv-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  dir="ltr"
                  className="rounded-none text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-tax" className="font-light">
                  ח.פ / ת.ז לקוח
                </Label>
                <Input
                  id="inv-tax"
                  value={customerTaxId}
                  onChange={(e) => setCustomerTaxId(e.target.value)}
                  dir="ltr"
                  className="rounded-none text-right"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-email" className="font-light">
                אימייל
              </Label>
              <Input
                id="inv-email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                type="email"
                dir="ltr"
                className="rounded-none text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-address" className="font-light">
                כתובת
              </Label>
              <Input
                id="inv-address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-3">
            <Label className="font-light">פריטים</Label>
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_64px_88px_auto] items-end gap-2"
              >
                <div className="space-y-1">
                  {index === 0 && (
                    <span className="text-[11px] font-light text-muted-foreground">
                      תיאור
                    </span>
                  )}
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, { description: e.target.value })
                    }
                    placeholder="תיאור הפריט"
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-1">
                  {index === 0 && (
                    <span className="text-[11px] font-light text-muted-foreground">
                      כמות
                    </span>
                  )}
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, { quantity: e.target.value })
                    }
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-1">
                  {index === 0 && (
                    <span className="text-[11px] font-light text-muted-foreground">
                      מחיר ליח׳
                    </span>
                  )}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, { unitPrice: e.target.value })
                    }
                    className="rounded-none"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="הסרת שורה"
                  disabled={items.length === 1}
                  onClick={() => removeRow(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              className="rounded-none text-xs font-light"
            >
              <Plus aria-hidden className="ml-1.5 h-3.5 w-3.5" />
              הוספת שורה
            </Button>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label htmlFor="inv-vat" className="font-light">
                מע״מ %
              </Label>
              <Input
                id="inv-vat"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                className="h-8 w-20 rounded-none"
              />
            </div>
            <div className="space-y-1 border border-border/50 bg-muted/30 p-3 text-sm font-light">
              <div className="flex justify-between">
                <span className="text-muted-foreground">סכום ביניים</span>
                <span className="tabular-nums">{money.format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">מע״מ ({rate}%)</span>
                <span className="tabular-nums">{money.format(vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-1 text-base font-medium">
                <span>סה״כ לתשלום</span>
                <span className="tabular-nums">{money.format(total)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-notes" className="font-light">
              הערות (אופציונלי)
            </Label>
            <Textarea
              id="inv-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="rounded-none resize-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-light text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-none text-xs font-light tracking-[0.15em]"
          >
            {isPending ? (
              <>
                <Loader2 aria-hidden className="ml-2 h-4 w-4 animate-spin" />
                מפיק חשבונית...
              </>
            ) : (
              "הפקת חשבונית"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
