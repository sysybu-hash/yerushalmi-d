"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteCustomer } from "@/app/(workspace)/workspace/customers/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteCustomerButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteCustomer(id);
    });
  }

  return (
    <ConfirmDialog
      title="מחיקת לקוח"
      description={`למחוק את "${name}" מרשימת הלקוחות? פעולה זו אינה הפיכה.`}
      confirmLabel="מחיקה"
      destructive
      onConfirm={handleDelete}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label={`מחיקת ${name}`}
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
