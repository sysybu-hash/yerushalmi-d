"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteOrder } from "@/app/(workspace)/workspace/orders/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteOrderButton({
  id,
  customerName,
}: {
  id: number;
  customerName: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteOrder(id);
    });
  }

  return (
    <ConfirmDialog
      title="מחיקת הזמנה"
      description={`למחוק הזמנה #${id} של ${customerName}? פעולה זו אינה הפיכה.`}
      confirmLabel="מחיקה"
      destructive
      onConfirm={handleDelete}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label={`מחיקת הזמנה #${id}`}
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
