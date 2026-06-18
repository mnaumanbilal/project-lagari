import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { env } from "../config/env";
import {
  AdminNotification,
  type AdminNotificationType,
} from "../db/models";
import { cacheGet, cacheSet } from "../lib/redis";
import {
  onLiveNotification,
  publishNotification,
  type LiveNotificationPayload,
} from "../lib/notification-pubsub";
import { sendAdminEmail } from "../providers/email.provider";
import { sendSlackMessage } from "../providers/slack.provider";
import { buildAdminNotificationEmail } from "../templates/admin-notification-email";
import {
  loadAdminOrderSnapshot,
  formatStatusLabel,
} from "./admin-order-email";

const LOW_STOCK_COOLDOWN_SEC = 3600;
const STREAM_TOKEN_TTL_SEC = 300;

export type EmitNotificationInput = {
  type: AdminNotificationType;
  title: string;
  body: string;
  linkPath?: string | null;
  payload?: Record<string, unknown> | null;
  emailSubject?: string;
  skipEmail?: boolean;
};

function mapRow(row: AdminNotification): LiveNotificationPayload {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkPath: row.linkPath,
    payload: row.payload,
    createdAt: row.createdAt.toISOString(),
  };
}

function dispatchExternalChannels(input: EmitNotificationInput): void {
  if (!input.skipEmail) {
    const subject = input.emailSubject ?? `[Lagari Admin] ${input.title}`;
    const mail = buildAdminNotificationEmail({
      subject,
      title: input.title,
      body: input.body,
      type: input.type,
      linkPath: input.linkPath,
      payload: input.payload,
      siteBaseUrl: env.domain,
      storefrontSiteUrl: env.publicSiteUrl.replace(/\/$/, ""),
    });
    void sendAdminEmail(mail).catch((err) => {
      console.error("admin email failed:", err);
    });
  }
  void sendSlackMessage(`*${input.title}*\n${input.body}`).catch((err) => {
    console.error("slack notify failed:", err);
  });
}

export async function emitNotification(
  input: EmitNotificationInput,
): Promise<LiveNotificationPayload> {
  const row = await AdminNotification.create({
    type: input.type,
    title: input.title,
    body: input.body,
    linkPath: input.linkPath ?? null,
    payload: input.payload ?? null,
  });

  const live = mapRow(row);
  await publishNotification(live);
  dispatchExternalChannels(input);
  return live;
}

export async function shouldEmitLowStock(variantId: string): Promise<boolean> {
  const key = `notif:low_stock:${variantId}`;
  const seen = await cacheGet(key);
  if (seen) return false;
  await cacheSet(key, "1", LOW_STOCK_COOLDOWN_SEC);
  return true;
}

export async function listNotifications(params: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const limit = Math.min(Math.max(params.limit ?? 30, 1), 100);
  const page = Math.max(params.page ?? 1, 1);
  const offset = (page - 1) * limit;

  const where =
    params.unreadOnly === true ? { readAt: { [Op.is]: null } } : {};

  const { rows, count } = await AdminNotification.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    notifications: rows.map((row) => ({
      ...mapRow(row),
      readAt: row.readAt?.toISOString() ?? null,
    })),
    total: count,
    page,
    limit,
  };
}

export async function getUnreadCount(): Promise<number> {
  return AdminNotification.count({ where: { readAt: { [Op.is]: null } } });
}

export async function markNotificationsRead(input: {
  ids?: string[];
  all?: boolean;
}): Promise<number> {
  const now = new Date();
  if (input.all) {
    const [updated] = await AdminNotification.update(
      { readAt: now },
      { where: { readAt: { [Op.is]: null } } },
    );
    return updated;
  }

  if (!input.ids?.length) return 0;
  const [updated] = await AdminNotification.update(
    { readAt: now },
    { where: { id: { [Op.in]: input.ids }, readAt: { [Op.is]: null } } },
  );
  return updated;
}

export function createNotificationStreamToken(adminId: string): string {
  return jwt.sign(
    { sub: adminId, type: "notification_stream" },
    env.jwt.accessSecret,
    { expiresIn: STREAM_TOKEN_TTL_SEC },
  );
}

export function verifyNotificationStreamToken(token: string): string {
  const payload = jwt.verify(token, env.jwt.accessSecret) as {
    sub: string;
    type: string;
  };
  if (payload.type !== "notification_stream") {
    throw new Error("Invalid stream token type");
  }
  return payload.sub;
}

export function subscribeAdminStream(
  listener: (payload: LiveNotificationPayload) => void,
): () => void {
  return onLiveNotification(listener);
}

// --- Event helpers ---

const STATUS_CHANGE_COPY: Record<
  string,
  { title: (n: number) => string; body: string; subject: (n: number) => string; label: string }
> = {
  confirmed: {
    title: (n) => `Order #${n} confirmed`,
    body: "A COD order has been confirmed and is ready for preparation.",
    subject: (n) => `[Lagari Admin] Order #${n} confirmed`,
    label: "Order confirmed",
  },
  shipped: {
    title: (n) => `Order #${n} dispatched`,
    body: "This order has been shipped. Courier and tracking are in the details below.",
    subject: (n) => `[Lagari Admin] Order #${n} dispatched`,
    label: "Order dispatched",
  },
  delivered: {
    title: (n) => `Order #${n} delivered`,
    body: "The courier marked this order as delivered.",
    subject: (n) => `[Lagari Admin] Order #${n} delivered`,
    label: "Order delivered",
  },
  cancelled: {
    title: (n) => `Order #${n} cancelled`,
    body: "This order was cancelled. Full order details are below for your records.",
    subject: (n) => `[Lagari Admin] Order #${n} cancelled`,
    label: "Order cancelled",
  },
  rto: {
    title: (n) => `Order #${n} — return to origin`,
    body: "Delivery could not be completed. Review the order and contact the customer if needed.",
    subject: (n) => `[Lagari Admin] Order #${n} — RTO`,
    label: "Return to origin",
  },
};

export async function notifyOrderPlaced(input: { orderId: string }) {
  const order = await loadAdminOrderSnapshot(input.orderId);
  if (!order) return;

  const linkPath = `/admin-panel-route/orders/${order.orderId}`;
  await emitNotification({
    type: "order.placed",
    title: `New order #${order.orderNumber}`,
    body: `${order.customerName} placed a COD order for ${order.itemCount} piece${order.itemCount === 1 ? "" : "s"} — ${order.shippingCity}.`,
    linkPath,
    payload: { order },
    emailSubject: `[Lagari Admin] New order #${order.orderNumber}`,
  });
}

export async function notifyOrderStatusChanged(input: {
  orderId: string;
  fromStatus: string;
  toStatus: string;
}) {
  const order = await loadAdminOrderSnapshot(input.orderId);
  if (!order) return;

  const copy = STATUS_CHANGE_COPY[input.toStatus] ?? {
    title: (n: number) => `Order #${n} → ${formatStatusLabel(input.toStatus)}`,
    body: `${order.customerName}: ${formatStatusLabel(input.fromStatus)} → ${formatStatusLabel(input.toStatus)}`,
    subject: (n: number) =>
      `[Lagari Admin] Order #${n} → ${formatStatusLabel(input.toStatus)}`,
    label: "Order update",
  };

  const linkPath = `/admin-panel-route/orders/${order.orderId}`;
  await emitNotification({
    type: "order.status_changed",
    title: copy.title(order.orderNumber),
    body: copy.body,
    linkPath,
    payload: {
      order,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      statusLabel: copy.label,
    },
    emailSubject: copy.subject(order.orderNumber),
  });
}

export async function notifyLowStock(input: {
  productTitle: string;
  variantName: string;
  sku: string;
  stock: number;
  threshold: number;
  productId: string;
}) {
  const linkPath = `/admin-panel-route/products/${input.productId}/edit`;
  await emitNotification({
    type: "inventory.low_stock",
    title: `Low stock: ${input.variantName}`,
    body: `${input.productTitle} (${input.sku}) — ${input.stock} left (threshold ${input.threshold})`,
    linkPath,
    payload: {
      productId: input.productId,
      sku: input.sku,
      stock: input.stock,
    },
    emailSubject: `[Lagari Admin] Low stock: ${input.variantName}`,
  });
}

export async function notifyProductUpdated(input: {
  productId: string;
  title: string;
  slug: string;
}) {
  const linkPath = `/admin-panel-route/products/${input.productId}/edit`;
  await emitNotification({
    type: "product.updated",
    title: `Product updated`,
    body: input.title,
    linkPath,
    payload: { productId: input.productId, slug: input.slug },
    skipEmail: true,
  });
}

export async function notifyReviewSubmitted(input: {
  reviewId: string;
  productTitle: string;
  productSlug: string;
  authorName: string;
  rating: number;
  body: string;
  contactPhone: string | null;
  contactEmail: string | null;
  isPublished: boolean;
}) {
  const linkPath = `/admin-panel-route/reviews?review=${input.reviewId}`;
  await emitNotification({
    type: "review.submitted",
    title: input.isPublished
      ? `New verified review`
      : `Review pending moderation`,
    body: `${input.authorName} rated ${input.productTitle} ${input.rating}/5`,
    linkPath,
    payload: {
      reviewId: input.reviewId,
      productTitle: input.productTitle,
      productSlug: input.productSlug,
      authorName: input.authorName,
      rating: input.rating,
      body: input.body,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      isPublished: input.isPublished,
    },
    emailSubject: input.isPublished
      ? `[Lagari Admin] New verified review`
      : `[Lagari Admin] Review pending moderation`,
  });
}
