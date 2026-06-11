"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { PRODUCT_CATEGORIES } from "@/components/workspace/product-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "newest", label: "חדש ביותר" },
  { value: "oldest", label: "ישן ביותר" },
  { value: "price_asc", label: "מחיר: נמוך לגבוה" },
  { value: "price_desc", label: "מחיר: גבוה לנמוך" },
] as const;

export function ProductsToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "all";
  const initialSort = searchParams.get("sort") ?? "newest";
  const [value, setValue] = React.useState(initialQ);

  React.useEffect(() => {
    setValue(initialQ);
  }, [initialQ]);

  function pushFilters(q: string, category: string, sort: string) {
    const params = new URLSearchParams();
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    if (category && category !== "all") params.set("category", category);
    if (sort && sort !== "newest") params.set("sort", sort);
    const qs = params.toString();
    router.push(qs ? `/workspace/products?${qs}` : "/workspace/products");
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    pushFilters(value, initialCategory, initialSort);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        dir="rtl"
        value={initialCategory}
        onValueChange={(category) =>
          pushFilters(value, category, initialSort)
        }
      >
        <SelectTrigger className="w-[160px] rounded-none">
          <SelectValue placeholder="קטגוריה" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל הקטגוריות</SelectItem>
          {PRODUCT_CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        dir="rtl"
        value={initialSort}
        onValueChange={(sort) => pushFilters(value, initialCategory, sort)}
      >
        <SelectTrigger className="w-[160px] rounded-none">
          <SelectValue placeholder="מיון" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
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
            placeholder="חיפוש לפי שם או תיאור..."
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
        {(initialQ ||
          (initialCategory && initialCategory !== "all") ||
          (initialSort && initialSort !== "newest")) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="ניקוי סינון"
            onClick={() => {
              setValue("");
              router.push("/workspace/products");
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
