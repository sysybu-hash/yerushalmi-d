"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="rounded-none text-xs font-light tracking-[0.15em] print:hidden"
    >
      <Printer aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
      הדפסה / שמירה כ-PDF
    </Button>
  );
}
