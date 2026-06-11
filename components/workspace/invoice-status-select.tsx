"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { updateInvoiceStatus } from "@/app/(workspace)/workspace/invoices/actions";
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  type InvoiceStatus,
} from "@/components/workspace/invoice-constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "border-stone-500/40 text-stone-600",
  sent: "border-sky-600/40 text-sky-700",
  paid: "border-emerald-600/40 text-emerald-700",
  cancelled: "border-red-600/40 text-red-700",
};

export function InvoiceStatusSelect({
  invoiceId,
  status,
}: {
  invoiceId: number;
  status: InvoiceStatus;
}) {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState(false);

  function handleChange(value: string) {
    setError(false);
    startTransition(async () => {
      try {
        await updateInvoiceStatus(invoiceId, value as InvoiceStatus);
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
            "h-8 w-32 rounded-none text-xs font-light",
            STATUS_STYLES[status]
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INVOICE_STATUSES.map((value) => (
            <SelectItem key={value} value={value} className="text-xs">
              {INVOICE_STATUS_LABELS[value]}
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
