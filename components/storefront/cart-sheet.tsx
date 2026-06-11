"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Gem, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
});

export function CartSheet() {
  const [open, setOpen] = React.useState(false);
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } =
    useCart();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const totalItems = mounted ? getTotalItems() : 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="סל קניות"
          className="relative hover:bg-transparent"
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
          {totalItems > 0 && (
            <span className="absolute -left-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-light text-background">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="px-6 pb-4 pt-8 text-right">
          <SheetTitle className="font-serif text-xl font-light tracking-wide">
            סל הקניות שלי
          </SheetTitle>
        </SheetHeader>

        <Separator className="bg-border/60" />

        {!mounted ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <p className="text-sm font-light text-muted-foreground">
              טוען סל...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={0.75}
            />
            <p className="text-sm font-light text-muted-foreground">
              הסל ריק — הוסיפו תכשיט שאהבתם
            </p>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border/60 overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  <Link
                    href={`/products/${item.id}`}
                    onClick={() => setOpen(false)}
                    className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-gradient-to-br from-stone-100 to-stone-200"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <Gem
                        className="h-5 w-5 text-stone-400"
                        strokeWidth={0.75}
                      />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.id}`}
                      onClick={() => setOpen(false)}
                      className="block truncate text-sm font-light hover:text-gold-dark"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-xs font-light text-muted-foreground">
                      {priceFormatter.format(item.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="הפחתת כמות"
                        className="h-10 w-10 rounded-none"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus aria-hidden className="h-3.5 w-3.5" />
                      </Button>
                      <span className="min-w-6 text-center text-xs tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="הוספת כמות"
                        className="h-10 w-10 rounded-none"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus aria-hidden className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`הסרת ${item.title} מהסל`}
                    onClick={() => removeItem(item.id)}
                    className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </li>
              ))}
            </ul>

            <Separator className="bg-border/60" />

            <div className="space-y-4 px-6 py-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-light">סך הכל</span>
                <span className="font-serif text-2xl font-light tracking-wide">
                  {priceFormatter.format(getTotalPrice())}
                </span>
              </div>

              <Button
                asChild
                className="w-full rounded-none text-xs font-light tracking-[0.2em]"
              >
                <Link href="/checkout" onClick={() => setOpen(false)}>
                  המשך להזמנה
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
