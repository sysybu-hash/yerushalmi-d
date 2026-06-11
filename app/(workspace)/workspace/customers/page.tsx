import { Suspense } from "react";
import { Users } from "lucide-react";

import { AddCustomerSheet } from "@/components/workspace/add-customer-sheet";
import { CustomersSearch } from "@/components/workspace/customers-search";
import { DeleteCustomerButton } from "@/components/workspace/delete-customer-button";
import { EditCustomerSheet } from "@/components/workspace/edit-customer-sheet";
import { ImportCustomersZone } from "@/components/workspace/import-customers-zone";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomers } from "./actions";

export const metadata = { title: "ניהול לקוחות" };

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type CustomersPageProps = {
  searchParams: { q?: string };
};

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const query = searchParams.q?.trim();
  const customers = await getCustomers(query);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-wide">
            ניהול לקוחות (CRM)
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            {customers.length > 0
              ? `${customers.length} לקוחות${query ? ` (תוצאות חיפוש)` : " רשומים"}`
              : "ניהול קהל הלקוחות של החנות"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddCustomerSheet />
          <ImportCustomersZone />
        </div>
      </div>

      <Suspense fallback={null}>
        <CustomersSearch />
      </Suspense>

      <div className="border border-border/60 bg-background">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Users
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={0.75}
            />
            <div>
              <p className="font-serif text-xl font-light">
                {query ? "לא נמצאו לקוחות" : "אין עדיין לקוחות"}
              </p>
              <p className="mt-1 text-sm font-light text-muted-foreground">
                {query
                  ? "נסו מונח חיפוש אחר"
                  : "הוסיפו לקוח חדש או ייבאו מקובץ CSV"}
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-right font-light">
                  שם מלא
                </TableHead>
                <TableHead className="text-right font-light">אימייל</TableHead>
                <TableHead className="text-right font-light">טלפון</TableHead>
                <TableHead className="text-right font-light">
                  תאריך הצטרפות
                </TableHead>
                <TableHead className="text-left font-light">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {customer.fullName}
                  </TableCell>
                  <TableCell className="font-light" dir="ltr">
                    {customer.email ?? "—"}
                  </TableCell>
                  <TableCell className="font-light tabular-nums" dir="ltr">
                    {customer.phone ?? "—"}
                  </TableCell>
                  <TableCell className="font-light tabular-nums">
                    {dateFormatter.format(customer.createdAt)}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <EditCustomerSheet customer={customer} />
                      <DeleteCustomerButton
                        id={customer.id}
                        name={customer.fullName}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
