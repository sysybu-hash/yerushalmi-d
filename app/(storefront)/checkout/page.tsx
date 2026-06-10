"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Gem, Loader2, ShoppingBag, XCircle } from "lucide-react";

import { useCart } from "@/hooks/use-cart";
import { createOrder } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
});

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice } = useCart();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const customer = {
      fullName: formData.get("fullName")?.toString() ?? "",
      email: formData.get("email")?.toString() ?? "",
      phone: formData.get("phone")?.toString() ?? "",
    };

    startTransition(async () => {
      try {
        await createOrder(
          customer,
          items.map((i) => ({ id: i.id, quantity: i.quantity }))
        );
        clearCart();
        router.push("/checkout/success");
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "אירעה שגיאה — נסו שוב בעוד רגע"
        );
      }
    });
  }

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <ShoppingBag
          className="h-10 w-10 text-muted-foreground"
          strokeWidth={0.75}
        />
        <p className="font-serif text-xl font-light">הסל שלכם ריק</p>
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="rounded-none text-xs font-light tracking-[0.15em]"
        >
          חזרה לחנות
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
      <div className="text-center">
        <p className="text-[11px] tracking-[0.25em] text-muted-foreground">
          עוד רגע וזה שלכם
        </p>
        <h1 className="mt-3 font-serif text-3xl font-light tracking-wide sm:text-4xl">
          השלמת הזמנה
        </h1>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        {/* סיכום ההזמנה */}
        <div className="border border-border/60 bg-stone-50/50 p-6 sm:p-8">
          <h2 className="font-serif text-xl font-light tracking-wide">
            סיכום הזמנה
          </h2>

          <ul className="mt-6 divide-y divide-border/60">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-gradient-to-br from-stone-100 to-stone-200">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <Gem
                      className="h-4 w-4 text-stone-400"
                      strokeWidth={0.75}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-light">{item.title}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs font-light text-muted-foreground">
                      כמות: {item.quantity}
                    </p>
                  )}
                </div>

                <span className="shrink-0 text-sm font-light tabular-nums">
                  {priceFormatter.format(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <Separator className="bg-border/60" />

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-light">סך הכל לתשלום</span>
            <span className="font-serif text-3xl font-light tracking-wide">
              {priceFormatter.format(getTotalPrice())}
            </span>
          </div>
        </div>

        {/* פרטי הלקוח */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="font-serif text-xl font-light tracking-wide">
            פרטים ליצירת קשר
          </h2>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="font-light">
              שם מלא *
            </Label>
            <Input
              id="fullName"
              name="fullName"
              required
              autoComplete="name"
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="font-light">
              טלפון *
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              dir="ltr"
              className="rounded-none text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-light">
              אימייל
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              className="rounded-none text-right"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-light text-destructive">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-none text-xs font-light tracking-[0.2em]"
          >
            {isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                שולח הזמנה...
              </>
            ) : (
              "אישור הזמנה"
            )}
          </Button>

          <p className="text-center text-[11px] font-light leading-relaxed text-muted-foreground">
            לאחר אישור ההזמנה ניצור עמכם קשר לתיאום התשלום והמשלוח.
            <br />
            שירות עד בית הלקוח · אחריות מלאה ותעודה גימולוגית
          </p>
        </form>
      </div>
    </section>
  );
}
