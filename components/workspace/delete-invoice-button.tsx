"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteInvoice } from "@/app/(workspace)/workspace/invoices/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteInvoiceButton({
  id,
  invoiceNumber,
}: {
  id: number;
  invoiceNumber: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteInvoice(id);
    });
  }

  return (
    <ConfirmDialog
      title="מחיקת חשבונית"
      description={`למחוק את חשבונית ${invoiceNumber}? פעולה זו אינה הפיכה.`}
      confirmLabel="מחיקה"
      destructive
      onConfirm={handleDelete}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label={`מחיקת חשבונית ${invoiceNumber}`}
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive"
        >
          {isPending ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          )}
        </Button>
      }
    />
  );
}
