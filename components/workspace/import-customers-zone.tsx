"use client";

import * as React from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, XCircle } from "lucide-react";

import {
  importCustomers,
  type ImportCustomerRow,
} from "@/app/(workspace)/workspace/customers/actions";
import { Button } from "@/components/ui/button";

/**
 * פירוק CSV קל-משקל: שורות לפי ירידות שורה, עמודות לפי פסיקים.
 * תומך בשורת כותרת (עברית או אנגלית) ומזהה את סדר העמודות לפיה;
 * בלעדיה ההנחה היא: שם מלא, אימייל, טלפון.
 */
function parseCsv(text: string): ImportCustomerRow[] {
  const lines = text
    .replace(/^﻿/, "") // הסרת BOM של אקסל
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const HEADER_ALIASES: Record<keyof ImportCustomerRow, string[]> = {
    full_name: ["full_name", "fullname", "name", "שם מלא", "שם"],
    email: ["email", "mail", "אימייל", 'דוא"ל', "מייל"],
    phone: ["phone", "mobile", "tel", "טלפון", "נייד"],
  };

  const firstCells = lines[0].split(",").map((c) => c.trim().toLowerCase());
  const columnOrder: (keyof ImportCustomerRow | null)[] = firstCells.map(
    (cell) =>
      (Object.keys(HEADER_ALIASES) as (keyof ImportCustomerRow)[]).find(
        (key) => HEADER_ALIASES[key].includes(cell)
      ) ?? null
  );

  const hasHeader = columnOrder.some((c) => c !== null);
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const order: (keyof ImportCustomerRow | null)[] = hasHeader
    ? columnOrder
    : ["full_name", "email", "phone"];

  return dataLines.map((line) => {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: ImportCustomerRow = { full_name: "", email: "", phone: "" };

    order.forEach((key, index) => {
      if (key && cells[index]) row[key] = cells[index];
    });

    return row;
  });
}

type ImportState =
  | { status: "idle" }
  | { status: "working" }
  | { status: "success"; imported: number; skipped: number }
  | { status: "error"; message: string };

export function ImportCustomersZone() {
  const [state, setState] = React.useState<ImportState>({ status: "idle" });
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setState({ status: "working" });

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length === 0) {
        throw new Error("הקובץ ריק או בפורמט לא מזוהה");
      }

      const result = await importCustomers(rows);
      setState({ status: "success", ...result });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "הייבוא נכשל — נסו שוב",
      });
    } finally {
      // איפוס שדה הקובץ כדי לאפשר העלאה חוזרת של אותו קובץ
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <Button
        variant="outline"
        disabled={state.status === "working"}
        onClick={() => inputRef.current?.click()}
        className="rounded-none border-dashed text-xs font-light tracking-[0.1em]"
      >
        {state.status === "working" ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            מייבא לקוחות...
          </>
        ) : (
          <>
            <FileSpreadsheet className="ml-2 h-4 w-4" strokeWidth={1.5} />
            ייבוא לקוחות מקובץ CSV
          </>
        )}
      </Button>

      {state.status === "success" && (
        <p className="flex items-center gap-1.5 text-xs font-light text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          יובאו {state.imported} לקוחות בהצלחה
          {state.skipped > 0 && ` (${state.skipped} דולגו — כפולים או חסרים)`}
        </p>
      )}

      {state.status === "error" && (
        <p className="flex items-center gap-1.5 text-xs font-light text-destructive">
          <XCircle className="h-3.5 w-3.5" />
          {state.message}
        </p>
      )}
    </div>
  );
}
