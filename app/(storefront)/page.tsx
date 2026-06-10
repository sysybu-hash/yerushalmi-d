import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
        כי יופי נצחי ראוי לשלמות
      </p>
      <h1 className="mt-6 max-w-3xl font-serif text-4xl font-light leading-tight tracking-wide sm:text-6xl">
        יהלומים נדירים,
        <br />
        נוצרים לנצח
      </h1>
      <p className="mt-6 max-w-xl text-sm font-light leading-relaxed text-muted-foreground">
        גלו קולקציה מוקפדת של תכשיטי יוקרה — כל אבן נבחרת ביד, כל שיבוץ הוא
        יצירת אמנות.
      </p>
      <Button
        asChild
        variant="outline"
        className="mt-10 rounded-none border-foreground/40 px-10 text-xs font-light tracking-[0.15em] hover:bg-foreground hover:text-background"
      >
        <Link href="/collections/diamonds">לצפייה בקולקציה</Link>
      </Button>
    </section>
  );
}
