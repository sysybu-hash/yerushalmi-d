"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle
        aria-hidden
        className="h-12 w-12 text-gold"
        strokeWidth={1}
      />
      <h1 className="mt-6 font-serif text-2xl font-medium tracking-wide">
        אירעה תקלה בלתי צפויה
      </h1>
      <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
        מצטערים — משהו השתבש בטעינת העמוד. נסו שוב, ואם התקלה חוזרת נשמח שתיצרו
        איתנו קשר.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={reset}
          className="rounded-none text-xs tracking-[0.15em]"
        >
          נסו שוב
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-none text-xs tracking-[0.15em]"
        >
          <Link href="/">חזרה לדף הבית</Link>
        </Button>
      </div>
    </div>
  );
}
