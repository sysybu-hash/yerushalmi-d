"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function WorkspaceError({
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
        className="h-10 w-10 text-destructive"
        strokeWidth={1.25}
      />
      <h1 className="mt-5 text-xl font-medium">אירעה שגיאה</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        לא הצלחנו להשלים את הפעולה. נסו שוב, ואם הבעיה נמשכת רעננו את העמוד.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/70">
          קוד שגיאה: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} className="rounded-none text-xs">
          נסו שוב
        </Button>
        <Button asChild variant="outline" className="rounded-none text-xs">
          <Link href="/workspace">חזרה ללוח הבקרה</Link>
        </Button>
      </div>
    </div>
  );
}
