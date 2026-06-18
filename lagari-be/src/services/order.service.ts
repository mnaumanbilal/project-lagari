import { Op, type Transaction, type WhereOptions } from "sequelize";
import { sequelize } from "../config/database";
import {
  Customer,
  Order,
  OrderItem,
  OrderTimelineEvent,
  Product,
  ProductVariant,
  type OrderStatus,
} from "../db/models";
import { AppError } from "../middleware/errorHandler";
import { clearCart, getCart } from "./cart.service";
import { checkVariantLowStock } from "./inventory-alert.service";
import { notifyCustomerOrderEvent } from "./customer-notification.service";
import {
  notifyOrderPlaced,
  notifyOrderStatusChanged,
} from "./notification.service";
import { tryNormalizePkPhone, normalizeEmail } from "../utils/contact-normalize";
import { cacheDel, cacheSetNx } from "../lib/redis";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "rto", "cancelled"],
  confirmed: ["shipped", "rto", "cancelled"],
  shipped: ["delivered", "rto"],
  delivered: [],
  rto: [],
  cancelled: [],
};

const ORDER_INCLUDES = [
  { association: "customer" as const },
  { association: "items" as const },
  {
    association: "timeline" as const,
    separate: true,
    order: [["createdAt", "ASC"]] as [string, string][],
  },
];

type OrderWithRelations = Order & {
  customer?: Customer;
  items?: OrderItem[];
  timeline?: OrderTimelineEvent[];
};

export function getAllowedNextStatuses(status: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

function buildItemPreview(items: OrderItem[]): { itemCount: number; itemPreview: string } {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const parts = items.map(
    (item) => `${item.productTitleSnapshot} ×${item.quantity}`,
  );
  let itemPreview = parts.join(", ");
  if (itemPreview.length > 80) {
    itemPreview = `${itemPreview.slice(0, 77)}...`;
  }
  return { itemCount, itemPreview: itemPreview || "—" };
}

export function mapOrderSummary(order: OrderWithRelations) {
  const customer = order.customer;
  const items = order.items ?? [];
  const { itemCount, itemPreview } = buildItemPreview(items);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalPkr: order.totalPkr,
    customerName: customer?.fullName ?? "—",
    customerPhone: customer?.phone ?? "—",
    customerEmail: customer?.email ?? null,
    shippingCity: order.shippingCity,
    itemCount,
    itemPreview,
    createdAt: order.createdAt,
    archivedAt: order.archivedAt,
  };
}

export function mapOrderDetail(order: OrderWithRelations) {
  const customer = order.customer;
  const items = order.items ?? [];
  const timeline = [...(order.timeline ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return {
    ...mapOrderSummary(order),
    subtotalPkr: order.subtotalPkr,
    discountPkr: order.discountPkr,
    shippingAddress: order.shippingAddress,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    adminNotes: order.adminNotes,
    cancelReason: order.cancelReason,
    items: items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productTitleSnapshot: item.productTitleSnapshot,
      productSlugSnapshot: item.productSlugSnapshot,
      variantNameSnapshot: item.variantNameSnapshot,
      unitPricePkr: item.unitPricePkr,
      quantity: item.quantity,
      lineTotalPkr: item.unitPricePkr * item.quantity,
    })),
    timeline: timeline.map((event) => ({
      eventType: event.eventType,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      message: event.message,
      createdAt: event.createdAt,
    })),
    allowedNextStatuses: getAllowedNextStatuses(order.status),
  };
}

async function restoreOrderStock(orderId: string, transaction: Transaction) {
  const items = await OrderItem.findAll({ where: { orderId }, transaction });
  for (const item of items) {
    await ProductVariant.increment("stock", {
      by: item.quantity,
      where: { id: item.variantId },
      transaction,
    });
  }
}

export async function listAdminOrders(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  archived?: "true" | "false" | "all";
}) {
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
  const page = Math.max(params.page ?? 1, 1);
  const offset = (page - 1) * limit;

  const where: WhereOptions = {};
  if (params.status) {
    where.status = params.status;
  }

  const archivedFilter = params.archived ?? "false";
  if (archivedFilter === "true") {
    where.archivedAt = { [Op.ne]: null };
  } else if (archivedFilter === "false") {
    where.archivedAt = null;
  }

  const search = params.search?.trim();
  if (search) {
    const orConditions: WhereOptions[] = [
      { "$customer.full_name$": { [Op.iLike]: `%${search}%` } },
      { "$customer.phone$": { [Op.iLike]: `%${search}%` } },
    ];
    const asNumber = Number.parseInt(search, 10);
    if (!Number.isNaN(asNumber) && String(asNumber) === search) {
      orConditions.push({ orderNumber: asNumber });
    }
    Object.assign(where, { [Op.or]: orConditions });
  }

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [
      { association: "customer", required: false },
      {
        association: "items",
        attributes: ["productTitleSnapshot", "variantNameSnapshot", "quantity"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    subQuery: false,
    distinct: true,
  });

  return {
    orders: rows.map((order) => mapOrderSummary(order as OrderWithRelations)),
    total: count,
    page,
    limit,
  };
}

export async function getAdminOrderById(orderId: string) {
  const order = await Order.findByPk(orderId, { include: ORDER_INCLUDES });
  if (!order) {
    throw new AppError(404, "Order not found");
  }
  return mapOrderDetail(order as OrderWithRelations);
}

export async function updateOrderStatus(input: {
  orderId: string;
  toStatus: OrderStatus;
  actorAdminId: string | null;
  note?: string;
  cancelReason?: string;
  courierName?: string;
  trackingNumber?: string;
}) {
  return sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(input.orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!order) {
      throw new AppError(404, "Order not found");
    }

    const customer = order.customerId
      ? await Customer.findByPk(order.customerId, { transaction })
      : null;

    const fromStatus = order.status;
    const allowed = ALLOWED_TRANSITIONS[fromStatus] ?? [];
    if (!allowed.includes(input.toStatus)) {
      throw new AppError(
        400,
        `Cannot transition from ${fromStatus} to ${input.toStatus}`,
      );
    }

    let shippedCourier: string | undefined;
    let shippedTracking: string | undefined;

    if (input.toStatus === "shipped") {
      shippedCourier = input.courierName?.trim();
      shippedTracking = input.trackingNumber?.trim();
      if (!shippedCourier || !shippedTracking) {
        throw new AppError(
          400,
          "Courier name and tracking number are required when marking as shipped",
        );
      }
      await order.update(
        { courierName: shippedCourier, trackingNumber: shippedTracking },
        { transaction },
      );
    }

    await order.update(
      {
        status: input.toStatus,
        ...(input.toStatus === "cancelled"
          ? { cancelReason: input.cancelReason?.trim() || null }
          : {}),
      },
      { transaction },
    );

    if (input.toStatus === "cancelled" || input.toStatus === "rto") {
      await restoreOrderStock(order.id, transaction);
    }

    if (input.toStatus === "rto" && customer) {
      await customer.increment("rtoCount", { by: 1, transaction });
    }

    const message =
      input.note?.trim() ||
      (input.toStatus === "shipped" && shippedCourier && shippedTracking
        ? `Dispatched via ${shippedCourier} — tracking ${shippedTracking}`
        : `Status changed to ${input.toStatus}`);

    await OrderTimelineEvent.create(
      {
        orderId: order.id,
        actorAdminId: input.actorAdminId,
        eventType: "status_changed",
        fromStatus,
        toStatus: input.toStatus,
        message,
      },
      { transaction },
    );

    const detail = await Order.findByPk(order.id, {
      include: ORDER_INCLUDES,
      transaction,
    });

    const mapped = mapOrderDetail(detail as OrderWithRelations);
    void notifyOrderStatusChanged({
      orderId: order.id,
      fromStatus,
      toStatus: input.toStatus,
    }).catch((err) => console.error("order status notification failed:", err));

    void notifyCustomerOrderEvent(order.id, input.toStatus).catch((err) =>
      console.error("customer order notification failed:", err),
    );

    return mapped;
  });
}

export async function updateAdminOrderNotes(orderId: string, adminNotes: string | null) {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new AppError(404, "Order not found");
  }
  await order.update({ adminNotes: adminNotes?.trim() || null });
  return getAdminOrderById(orderId);
}

export type BulkActionResult = {
  succeeded: number;
  failed: Array<{ id: string; error: string }>;
};

export async function archiveOrder(orderId: string, archived: boolean) {
  const order = await Order.findByPk(orderId);
  if (!order) throw new AppError(404, "Order not found");
  await order.update({ archivedAt: archived ? new Date() : null });
  return getAdminOrderById(orderId);
}

export async function bulkArchiveOrders(
  ids: string[],
  archived: boolean,
): Promise<BulkActionResult> {
  const result: BulkActionResult = { succeeded: 0, failed: [] };
  for (const id of ids) {
    try {
      await archiveOrder(id, archived);
      result.succeeded += 1;
    } catch (err) {
      const message =
        err instanceof AppError ? err.message : "Could not archive order";
      result.failed.push({ id, error: message });
    }
  }
  return result;
}

export async function placeCodOrder(input: {
  sessionId: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  email?: string;
}) {
  const lockKey = `checkout:lock:${input.sessionId}`;
  const locked = await cacheSetNx(lockKey, "1", 60);
  if (!locked) {
    throw new AppError(
      409,
      "Checkout already in progress. Please wait a moment.",
    );
  }

  try {
    const cart = await getCart(input.sessionId);
    if (!cart.items.length) {
      return null;
    }

    // Normalise contact before storing so review lookups always match
    const normalizedPhone = tryNormalizePkPhone(input.phone) ?? input.phone;
    const normalizedEmail = input.email ? (() => {
      try { return normalizeEmail(input.email!); } catch { return input.email!; }
    })() : undefined;

    return await sequelize.transaction(async (t) => {
    const [customer] = await Customer.findOrCreate({
      where: { phone: normalizedPhone },
      defaults: {
        phone: normalizedPhone,
        fullName: input.fullName,
        email: normalizedEmail ?? null,
      },
      transaction: t,
    });

    await customer.update(
      { fullName: input.fullName, email: normalizedEmail ?? customer.email },
      { transaction: t },
    );

    const order = await Order.create(
      {
        customerId: customer.id,
        sessionId: input.sessionId,
        status: "pending",
        subtotalPkr: cart.subtotalPkr,
        discountPkr: 0,
        totalPkr: cart.subtotalPkr,
        shippingCity: input.city,
        shippingAddress: input.address,
        notes: null,
      },
      { transaction: t },
    );

    const lowStockVariantIds: string[] = [];

    for (const line of cart.items) {
      const variant = await ProductVariant.findByPk(line.variantId, {
        include: [{ model: Product, as: "product" }],
        transaction: t,
      });
      if (!variant || variant.stock < line.quantity) {
        throw new Error(`Insufficient stock for ${line.variantName}`);
      }

      await variant.decrement("stock", { by: line.quantity, transaction: t });
      lowStockVariantIds.push(variant.id);

      const productSlug =
        line.productSlug?.trim() ||
        (variant as ProductVariant & { product?: Product }).product?.slug ||
        null;

      await OrderItem.create(
        {
          orderId: order.id,
          variantId: variant.id,
          productTitleSnapshot: line.productTitle,
          productSlugSnapshot: productSlug,
          variantNameSnapshot: line.variantName,
          unitPricePkr: line.unitPricePkr,
          quantity: line.quantity,
        },
        { transaction: t },
      );
    }

    await OrderTimelineEvent.create(
      {
        orderId: order.id,
        actorAdminId: null,
        eventType: "placed",
        fromStatus: null,
        toStatus: "pending",
        message: "Order placed by customer (COD)",
      },
      { transaction: t },
    );

    await clearCart(input.sessionId);

    const result = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalPkr: order.totalPkr,
    };

    void notifyOrderPlaced({ orderId: order.id }).catch((err) =>
      console.error("order placed notification failed:", err),
    );

    void notifyCustomerOrderEvent(order.id, "placed").catch((err) =>
      console.error("customer order notification failed:", err),
    );

    for (const variantId of lowStockVariantIds) {
      void checkVariantLowStock(variantId).catch((err) =>
        console.error("low stock check failed:", err),
      );
    }

    return result;
    });
  } finally {
    await cacheDel(lockKey);
  }
}
