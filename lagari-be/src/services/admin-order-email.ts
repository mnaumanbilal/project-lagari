import {
  Customer,
  Order,
  OrderItem,
  type OrderStatus,
} from "../db/models";

export type AdminOrderLineItem = {
  title: string;
  variant: string;
  quantity: number;
  unitPricePkr: number;
  lineTotalPkr: number;
};

/** Full order snapshot for admin notification emails. */
export type AdminOrderEmailSnapshot = {
  orderId: string;
  orderNumber: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingCity: string;
  shippingAddress: string;
  subtotalPkr: number;
  discountPkr: number;
  totalPkr: number;
  courierName: string | null;
  trackingNumber: string | null;
  cancelReason: string | null;
  customerNotes: string | null;
  placedAt: string;
  itemCount: number;
  items: AdminOrderLineItem[];
};

export function formatPkr(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function loadAdminOrderSnapshot(
  orderId: string,
): Promise<AdminOrderEmailSnapshot | null> {
  const order = await Order.findByPk(orderId, {
    include: [
      { association: "customer" },
      { association: "items" },
    ],
  });
  if (!order) return null;

  const customer = (order as Order & { customer?: Customer }).customer;
  const items = (order as Order & { items?: OrderItem[] }).items ?? [];

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: customer?.fullName?.trim() || "—",
    customerPhone: customer?.phone ?? "—",
    customerEmail: customer?.email?.trim() || null,
    shippingCity: order.shippingCity,
    shippingAddress: order.shippingAddress,
    subtotalPkr: order.subtotalPkr,
    discountPkr: order.discountPkr,
    totalPkr: order.totalPkr,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    cancelReason: order.cancelReason,
    customerNotes: order.notes,
    placedAt: order.createdAt.toISOString(),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items: items.map((item) => ({
      title: item.productTitleSnapshot,
      variant: item.variantNameSnapshot,
      quantity: item.quantity,
      unitPricePkr: item.unitPricePkr,
      lineTotalPkr: item.unitPricePkr * item.quantity,
    })),
  };
}

export function buildAdminOrderPlainText(
  order: AdminOrderEmailSnapshot,
  extras?: { fromStatus?: string; toStatus?: string; headline?: string },
): string {
  const lines: string[] = [];

  if (extras?.headline) lines.push(extras.headline, "");
  if (extras?.fromStatus && extras?.toStatus) {
    lines.push(
      `Status: ${formatStatusLabel(extras.fromStatus)} → ${formatStatusLabel(extras.toStatus)}`,
      "",
    );
  }

  lines.push(
    `Order #${order.orderNumber}`,
    `Placed: ${new Date(order.placedAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}`,
    `Current status: ${formatStatusLabel(order.status)}`,
    "",
    "Customer",
    `Name: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `Email: ${order.customerEmail ?? "—"}`,
    "",
    "Delivery",
    `${order.shippingAddress}`,
    `${order.shippingCity}`,
    "",
  );

  if (order.customerNotes) {
    lines.push(`Customer notes: ${order.customerNotes}`, "");
  }
  if (order.courierName && order.trackingNumber) {
    lines.push(
      `Courier: ${order.courierName}`,
      `Tracking: ${order.trackingNumber}`,
      "",
    );
  }
  if (order.cancelReason) {
    lines.push(`Cancel reason: ${order.cancelReason}`, "");
  }

  lines.push("Items");
  for (const item of order.items) {
    lines.push(
      `• ${item.title} (${item.variant}) ×${item.quantity} @ ${formatPkr(item.unitPricePkr)} = ${formatPkr(item.lineTotalPkr)}`,
    );
  }

  lines.push(
    "",
    `Subtotal: ${formatPkr(order.subtotalPkr)}`,
    order.discountPkr > 0 ? `Discount: −${formatPkr(order.discountPkr)}` : "",
    `Order total: ${formatPkr(order.totalPkr)}`,
  );

  return lines.filter(Boolean).join("\n");
}
