"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteProduct } from "@/app/(workspace)/workspace/products/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteProductButton({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteProduct(id);
    });
  }

  return (
    <ConfirmDialog
      title="מחיקת מוצר"
      description={`למחוק את "${title}" מהמלאי? פעולה זו אינה הפיכה.`}
      confirmLabel="מחיקה"
      destructive
      onConfirm={handleDelete}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label={`מחיקת ${title}`}
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
