"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteCustomer } from "@/app/(workspace)/workspace/customers/actions";
import { Button } from "@/components/ui/button";

export function DeleteCustomerButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!window.confirm(`למחוק את "${name}" מרשימת הלקוחות?`)) return;

    startTransition(async () => {
      await deleteCustomer(id);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`מחיקת ${name}`}
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
