"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
} from "@/components/workspace/order-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrdersToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const initialStatus = searchParams.get("status") ?? "all";
  const [value, setValue] = React.useState(initialQ);

  React.useEffect(() => {
    setValue(initialQ);
  }, [initialQ]);

  function pushFilters(q: string, status: string) {
    const params = new URLSearchParams();
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    if (status && status !== "all") params.set("status", status);
    const qs = params.toString();
    router.push(qs ? `/workspace/orders?${qs}` : "/workspace/orders");
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    pushFilters(value, initialStatus);
  }

  function handleStatusChange(status: string) {
    pushFilters(value, status);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        dir="rtl"
        value={initialStatus}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[180px] rounded-none">
          <SelectValue placeholder="סינון לפי סטטוס" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל הסטטוסים</SelectItem>
          {ORDER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <form onSubmit={handleSearch} className="flex flex-1 gap-2 sm:max-w-md">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="חיפוש לפי שם, טלפון, אימייל או #מספר הזמנה..."
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
        {(initialQ || (initialStatus && initialStatus !== "all")) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="ניקוי סינון"
            onClick={() => {
              setValue("");
              router.push("/workspace/orders");
            }}
            className="shrink-0 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
