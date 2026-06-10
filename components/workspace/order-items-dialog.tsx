"use client";

import { PackageOpen } from "lucide-react";

import type { OrderItem } from "@/db/schema";
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
  orderId,
  items,
}: {
  orderId: number;
  items: OrderItem[];
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
            הזמנה מס׳ {orderId}
          </DialogTitle>
          <DialogDescription className="font-light">
            {items.length} פריטים בהזמנה
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
