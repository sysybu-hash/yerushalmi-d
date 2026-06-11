export const ORDER_STATUSES = ["pending", "paid", "shipped"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "ממתין לתשלום",
  paid: "שולם",
  shipped: "נשלח",
};

export const DELIVERY_METHOD_LABELS = {
  delivery: "משלוח עד הבית",
  pickup: "איסוף עצמי",
} as const;
