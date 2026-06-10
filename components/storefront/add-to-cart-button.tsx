"use client";

import * as React from "react";
import { Check, ShoppingBag } from "lucide-react";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";

type AddToCartButtonProps = {
  id: number;
  title: string;
  price: number;
  imageUrl: string | null;
};

export function AddToCartButton(props: AddToCartButtonProps) {
  const addItem = useCart((state) => state.addItem);
  const [added, setAdded] = React.useState(false);

  function handleAdd() {
    addItem(props);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleAdd}
      className="h-8 w-full rounded-none text-[11px] font-light tracking-[0.1em] text-muted-foreground hover:bg-foreground hover:text-background"
    >
      {added ? (
        <>
          <Check className="ml-1.5 h-3.5 w-3.5" />
          נוסף לסל
        </>
      ) : (
        <>
          <ShoppingBag className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
          הוספה לסל
        </>
      )}
    </Button>
  );
}
