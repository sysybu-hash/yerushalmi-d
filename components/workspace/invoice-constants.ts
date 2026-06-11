export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "cancelled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "טיוטה",
  sent: "נשלחה",
  paid: "שולמה",
  cancelled: "בוטלה",
};

export const INVOICE_TYPES = ["invoice", "receipt"] as const;

export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  invoice: "חשבונית מס",
  receipt: "חשבונית מס/קבלה",
};
