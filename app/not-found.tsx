import Link from "next/link";
import { Gem } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Gem aria-hidden className="h-10 w-10 text-gold/60" strokeWidth={0.75} />
      <p className="mt-6 text-[11px] tracking-[0.3em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-4 font-serif text-3xl font-light tracking-wide">
        העמוד לא נמצא
      </h1>
      <p className="mt-4 max-w-md text-sm font-light text-muted-foreground">
        ייתכן שהקישור שגוי, או שהעמוד הוסר. נשמח להחזיר אתכם לחנות.
      </p>
      <Button
        asChild
        variant="outline"
        className="mt-10 rounded-none border-foreground/40 px-10 text-xs font-light tracking-[0.2em]"
      >
        <Link href="/">חזרה לדף הבית</Link>
      </Button>
    </main>
  );
}
