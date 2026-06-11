"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CustomersSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [value, setValue] = React.useState(initialQ);

  React.useEffect(() => {
    setValue(initialQ);
  }, [initialQ]);

  function applySearch(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = q.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    router.push(`/workspace/customers?${params.toString()}`);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    applySearch(value);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="חיפוש לפי שם, אימייל או טלפון..."
          className="rounded-none pr-10"
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        className="rounded-none text-xs font-light tracking-[0.1em]"
      >
        חיפוש
      </Button>
      {initialQ && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="ניקוי חיפוש"
          onClick={() => {
            setValue("");
            applySearch("");
          }}
          className="shrink-0 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
