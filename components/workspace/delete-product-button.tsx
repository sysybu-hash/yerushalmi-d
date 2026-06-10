"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteProduct } from "@/app/(workspace)/workspace/products/actions";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!window.confirm(`למחוק את "${title}" מהמלאי?`)) return;

    startTransition(async () => {
      await deleteProduct(id);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`מחיקת ${title}`}
      disabled={isPending}
      onClick={handleDelete}
      className="text-muted-foreground hover:text-destructive"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
      )}
    </Button>
  );
}
