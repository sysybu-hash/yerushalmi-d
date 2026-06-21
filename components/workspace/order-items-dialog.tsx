"use client";

import Link from "next/link";
import { PackageOpen, StickyNote, Truck } from "lucide-react";

import type { Order, OrderItem } from "@/db/schema";
import { OrderAdminNotesForm } from "@/components/workspace/order-admin-notes-form";
import { DELIVERY_METHOD_LABELS } from "@/components/workspace/order-constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
});

export function OrderItemsDialog({
  order,
  items,
  matchedCustomerId,
}: {
  order: Order;
  items: OrderItem[];
  matchedCustomerId?: number | null;
}) {
  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-none border-foreground/30 text-[11px] font-light tracking-[0.1em] hover:bg-foreground hover:text-background"
        >
          <PackageOpen className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
          צפה בפריטים
        </Button>
      </DialogTrigger>

      <DialogContent dir="rtl" className="max-w-md rounded-none">
        <DialogHeader className="text-right">
          <DialogTitle className="font-serif text-xl font-light tracking-wide">
            הזמנה מס׳ {order.id}
          </DialogTitle>
          <DialogDescription className="font-light">
            {items.length} פריטים · {order.customerName}
            {matchedCustomerId ? (
              <>
                {" · "}
                <Link
                  href={`/workspace/customers?q=${encodeURIComponent(order.customerPhone)}`}
                  className="text-gold-dark underline-offset-2 hover:underline"
                >
                  כרטיס לקוח
                </Link>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-none border border-border/60 bg-muted/20 p-4 text-sm font-light">
          <div className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
              </p>
              {order.deliveryMethod === "delivery" && order.deliveryAddress && (
                <p className="mt-1 text-muted-foreground">
                  {order.deliveryAddress}
                </p>
              )}
            </div>
          </div>

          {order.customerNotes && (
            <div className="flex items-start gap-2">
              <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">הערות לקוח</p>
                <p className="mt-0.5">{order.customerNotes}</p>
              </div>
            </div>
          )}
        </div>

        <ul className="divide-y divide-border/60">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-light">
                  {item.productTitle}
                </p>
                <p className="text-xs font-light text-muted-foreground">
                  כמות: {item.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-light tabular-nums">
                {priceFormatter.format(Number(item.price) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <Separator className="bg-border/60" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-light">סך הכל</span>
          <span className="font-serif text-2xl font-light tracking-wide">
            {priceFormatter.format(total)}
          </span>
        </div>

        <Separator className="bg-border/60" />

        <OrderAdminNotesForm
          orderId={order.id}
          defaultNotes={order.adminNotes}
        />
      </DialogContent>
    </Dialog>
  );
}
