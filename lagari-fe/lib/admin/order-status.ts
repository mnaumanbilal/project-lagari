export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "rto";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rto: "RTO",
};

export const ORDER_STATUS_ACTIONS: Record<
  OrderStatus,
  { status: OrderStatus; label: string }[]
> = {
  pending: [
    { status: "confirmed", label: "Confirm" },
    { status: "cancelled", label: "Cancel" },
    { status: "rto", label: "Mark RTO" },
  ],
  confirmed: [
    { status: "shipped", label: "Mark dispatched" },
    { status: "cancelled", label: "Cancel" },
    { status: "rto", label: "Mark RTO" },
  ],
  shipped: [
    { status: "delivered", label: "Mark delivered" },
    { status: "rto", label: "Mark RTO" },
  ],
  delivered: [],
  cancelled: [],
  rto: [],
};

export const ORDER_WORKFLOW_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
];

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "confirmed":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "shipped":
      return "bg-violet-500/15 text-violet-300 border-violet-500/30";
    case "delivered":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "cancelled":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "rto":
      return "bg-orange-500/15 text-orange-300 border-orange-500/30";
    default:
      return "bg-lagari-elevated text-lagari-muted border-lagari-border";
  }
}

export function isDestructiveStatus(status: string): boolean {
  return status === "cancelled" || status === "rto";
}

export function requiresFulfillment(status: string): boolean {
  return status === "shipped";
}

export function restoresInventory(status: string): boolean {
  return status === "cancelled" || status === "rto";
}

export function primaryNextAction(
  status: string,
  allowedNextStatuses?: string[],
): { status: OrderStatus; label: string } | null {
  const allowed = allowedNextStatuses ?? ORDER_STATUS_ACTIONS[status as OrderStatus]?.map((a) => a.status) ?? [];
  const actions = ORDER_STATUS_ACTIONS[status as OrderStatus] ?? [];
  return actions.find((action) => allowed.includes(action.status)) ?? null;
}
