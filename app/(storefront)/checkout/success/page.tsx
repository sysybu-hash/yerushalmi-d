import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = { title: "ההזמנה התקבלה" };

export default function CheckoutSuccessPage() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <CheckCircle2
        className="h-12 w-12 text-emerald-600"
        strokeWidth={0.75}
      />
      <h1 className="mt-6 font-serif text-3xl font-light tracking-wide sm:text-4xl">
        תודה! ההזמנה התקבלה
      </h1>
      <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
        נציג מטעמנו ייצור עמכם קשר בהקדם לתיאום התשלום והמשלוח.
        <br />
        מספר הטלפון שלנו תמיד פתוח עבורכם:{" "}
        <a href="tel:055-973-5000" className="underline" dir="ltr">
          055-973-5000
        </a>
      </p>
      <Button
        asChild
        variant="outline"
        className="mt-10 rounded-none border-foreground/40 px-10 text-xs font-light tracking-[0.2em] hover:bg-foreground hover:text-background"
      >
        <Link href="/">חזרה לחנות</Link>
      </Button>
    </section>
  );
}
