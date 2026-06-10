"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { updateOrderStatus } from "@/app/(workspace)/workspace/orders/actions";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/components/workspace/order-constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "border-amber-600/40 text-amber-700",
  paid: "border-emerald-600/40 text-emerald-700",
  shipped: "border-sky-600/40 text-sky-700",
};

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: number;
  status: OrderStatus;
}) {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState(false);

  function handleChange(value: string) {
    setError(false);
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, value as OrderStatus);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        dir="rtl"
        defaultValue={status}
        disabled={isPending}
        onValueChange={handleChange}
      >
        <SelectTrigger
          className={cn(
            "h-8 w-36 rounded-none text-xs font-light",
            STATUS_STYLES[status]
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((value) => (
            <SelectItem key={value} value={value} className="text-xs">
              {ORDER_STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      )}
      {error && (
        <span className="text-[11px] font-light text-destructive">
          העדכון נכשל
        </span>
      )}
    </div>
  );
}
