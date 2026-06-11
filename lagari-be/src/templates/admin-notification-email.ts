import type { AdminNotificationType } from "../db/models";
import type { AdminOrderEmailSnapshot } from "../services/admin-order-email";
import {
  buildAdminOrderPlainText,
  formatPkr,
  formatStatusLabel,
} from "../services/admin-order-email";
import {
  absoluteUrl,
  C,
  emailButton,
  emailDetailRow,
  emailLayout,
  FONT,
} from "./email-theme";

export type AdminNotificationEmailContext = {
  subject: string;
  title: string;
  body: string;
  type: AdminNotificationType;
  linkPath?: string | null;
  payload?: Record<string, unknown> | null;
  siteBaseUrl: string;
};

const TYPE_LABELS: Record<AdminNotificationType, string> = {
  "order.placed": "New order",
  "order.status_changed": "Order update",
  "inventory.low_stock": "Low stock",
  "product.updated": "Product update",
  "review.submitted": "Review",
};

const CTA_LABELS: Record<AdminNotificationType, string> = {
  "order.placed": "View order",
  "order.status_changed": "View order",
  "inventory.low_stock": "Edit product",
  "product.updated": "View product",
  "review.submitted": "View reviews",
};

function isOrderSnapshot(value: unknown): value is AdminOrderEmailSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AdminOrderEmailSnapshot).orderNumber === "number" &&
    Array.isArray((value as AdminOrderEmailSnapshot).items)
  );
}

function orderItemsTableHtml(order: AdminOrderEmailSnapshot): string {
  const rows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid ${C.border};font-family:${FONT};color:${C.text};font-size:14px;font-weight:500;">
            ${item.title}<br><span style="color:${C.textMuted};font-size:13px;font-weight:400;">${item.variant}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${C.border};text-align:center;font-family:${FONT};font-size:14px;color:${C.text};">×${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${C.border};text-align:right;font-family:${FONT};font-size:14px;font-weight:600;color:${C.text};">${formatPkr(item.lineTotalPkr)}</td>
        </tr>`,
    )
    .join("");

  const discountRow =
    order.discountPkr > 0
      ? `<tr>
          <td colspan="2" align="right" style="padding:8px 8px 0 0;color:${C.textMuted};font-size:13px;font-family:${FONT};">Discount</td>
          <td align="right" style="padding:8px 0 0;font-family:${FONT};font-size:13px;color:${C.textMuted};">−${formatPkr(order.discountPkr)}</td>
        </tr>`
      : "";

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;font-family:${FONT};">
    <thead>
      <tr>
        <th align="left" style="color:${C.label};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:10px;font-family:${FONT};">Item</th>
        <th style="color:${C.label};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:10px;font-family:${FONT};">Qty</th>
        <th align="right" style="color:${C.label};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:10px;font-family:${FONT};">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" align="right" style="padding:12px 8px 0 0;color:${C.textMuted};font-size:13px;font-family:${FONT};">Subtotal</td>
        <td align="right" style="padding:12px 0 0;font-family:${FONT};font-size:13px;color:${C.text};">${formatPkr(order.subtotalPkr)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td colspan="2" align="right" style="padding:10px 8px 0 0;color:${C.label};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;font-family:${FONT};">Order total</td>
        <td align="right" style="padding:10px 0 0;font-family:${FONT};font-size:18px;font-weight:700;color:${C.text};">${formatPkr(order.totalPkr)}</td>
      </tr>
    </tfoot>
  </table>`;
}

function orderDetailsHtml(
  order: AdminOrderEmailSnapshot,
  extras?: { fromStatus?: string; toStatus?: string },
): string {
  const placedAt = new Date(order.placedAt).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
  });

  const rows: string[] = [
    emailDetailRow("Order", `#${order.orderNumber}`),
    emailDetailRow("Placed", placedAt),
    emailDetailRow("Status", `<strong style="color:${C.label};">${formatStatusLabel(order.status)}</strong>`),
  ];

  if (extras?.fromStatus && extras?.toStatus) {
    rows.push(
      emailDetailRow(
        "Update",
        `${formatStatusLabel(extras.fromStatus)} → <strong style="color:${C.label};">${formatStatusLabel(extras.toStatus)}</strong>`,
      ),
    );
  }

  rows.push(
    emailDetailRow("Customer", order.customerName),
    emailDetailRow("Phone", `<a href="tel:${order.customerPhone}" style="color:${C.text};text-decoration:none;">${order.customerPhone}</a>`),
    emailDetailRow("Email", order.customerEmail
      ? `<a href="mailto:${order.customerEmail}" style="color:${C.label};text-decoration:none;">${order.customerEmail}</a>`
      : "—"),
    emailDetailRow(
      "Address",
      `<span style="color:${C.text};">${order.shippingAddress.replace(/\n/g, "<br>")}</span><br><span style="color:${C.textMuted};">${order.shippingCity}</span>`,
    ),
  );

  if (order.customerNotes) {
    rows.push(emailDetailRow("Customer notes", order.customerNotes));
  }
  if (order.courierName) {
    rows.push(emailDetailRow("Courier", order.courierName));
  }
  if (order.trackingNumber) {
    rows.push(emailDetailRow("Tracking", order.trackingNumber));
  }
  if (order.cancelReason) {
    rows.push(emailDetailRow("Cancel reason", order.cancelReason));
  }

  return `<table role="presentation" class="email-inset" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bgInset}" style="margin:20px 0 0;background-color:${C.bgInset};border:1px solid ${C.border};border-radius:4px;">
    <tr>
      <td style="padding:14px 16px;">
        <p style="margin:0 0 10px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${C.label};">Order details</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>
      </td>
    </tr>
  </table>
  <div style="margin:20px 0 0;">
    <p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${C.label};">Line items · ${order.itemCount} piece${order.itemCount === 1 ? "" : "s"}</p>
    ${orderItemsTableHtml(order)}
  </div>`;
}

function detailRows(ctx: AdminNotificationEmailContext): string {
  const p = ctx.payload ?? {};

  if (isOrderSnapshot(p.order)) {
    const extras =
      typeof p.fromStatus === "string" && typeof p.toStatus === "string"
        ? { fromStatus: p.fromStatus, toStatus: p.toStatus }
        : undefined;
    return orderDetailsHtml(p.order, extras);
  }

  const rows: string[] = [];

  if (typeof p.sku === "string") {
    rows.push(emailDetailRow("SKU", p.sku));
  }
  if (typeof p.stock === "number") {
    rows.push(emailDetailRow("Stock left", String(p.stock)));
  }
  if (typeof p.slug === "string") {
    rows.push(emailDetailRow("Slug", p.slug));
  }
  if (typeof p.isPublished === "boolean") {
    rows.push(
      emailDetailRow("Review status", p.isPublished ? "Published" : "Pending moderation"),
    );
  }

  if (!rows.length) return "";

  return `<table role="presentation" class="email-inset" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bgInset}" style="margin:20px 0 0;background-color:${C.bgInset};border:1px solid ${C.border};border-radius:4px;">
    <tr>
      <td style="padding:14px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>
      </td>
    </tr>
  </table>`;
}

export function buildAdminNotificationEmail(ctx: AdminNotificationEmailContext): {
  subject: string;
  text: string;
  html: string;
} {
  const typeLabel =
    typeof ctx.payload?.statusLabel === "string"
      ? ctx.payload.statusLabel
      : (TYPE_LABELS[ctx.type] ?? "Admin alert");
  const actionUrl = ctx.linkPath
    ? absoluteUrl(ctx.siteBaseUrl, ctx.linkPath)
    : absoluteUrl(ctx.siteBaseUrl, "/admin-panel-route/dashboard");
  const ctaLabel = CTA_LABELS[ctx.type] ?? "Open admin panel";

  const orderSnapshot = isOrderSnapshot(ctx.payload?.order)
    ? ctx.payload.order
    : null;

  const text = orderSnapshot
    ? `${ctx.title}\n\n${buildAdminOrderPlainTextFromContext(ctx)}\n\n${actionUrl}\n\n— Lagari Admin`
    : `${ctx.title}\n\n${ctx.body}\n\n${actionUrl}\n\n— Lagari Admin`;

  const inner = `
    <p style="margin:0 0 16px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${C.label};">Lagari · Admin</p>
    <p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${C.textMuted};">${typeLabel}</p>
    <h1 class="email-text" style="margin:0 0 12px;font-size:22px;font-weight:700;color:${C.text};font-family:${FONT};line-height:1.3;">${ctx.title}</h1>
    <p class="email-muted" style="margin:0;font-size:15px;line-height:1.55;color:${C.textMuted};font-family:${FONT};">${ctx.body}</p>
    ${detailRows(ctx)}
    ${emailButton(ctaLabel, actionUrl)}
    <p class="email-muted" style="margin:20px 0 0;font-size:12px;line-height:1.5;color:${C.textMuted};font-family:${FONT};">
      Or copy this link:<br>
      <a href="${actionUrl}" style="color:${C.label};word-break:break-all;">${actionUrl}</a>
    </p>`;

  return {
    subject: ctx.subject,
    text,
    html: emailLayout(inner),
  };
}

function buildAdminOrderPlainTextFromContext(ctx: AdminNotificationEmailContext): string {
  const p = ctx.payload ?? {};
  if (!isOrderSnapshot(p.order)) return ctx.body;

  return buildAdminOrderPlainText(p.order, {
    headline: ctx.body,
    fromStatus: typeof p.fromStatus === "string" ? p.fromStatus : undefined,
    toStatus: typeof p.toStatus === "string" ? p.toStatus : undefined,
  });
}
