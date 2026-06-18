import type { AdminNotificationType } from "../db/models";
import type { AdminOrderEmailSnapshot } from "../services/admin-order-email";
import {
  buildAdminOrderPlainText,
  formatStatusLabel,
} from "../services/admin-order-email";
import {
  absoluteUrl,
  buildOrderLineItemsTableHtml,
  C,
  emailButton,
  emailContactLinksHtml,
  emailDetailRow,
  emailLayout,
  emailStarRatingHtml,
  escapeHtml,
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
  storefrontSiteUrl: string;
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
  "review.submitted": "View this review",
};

function isOrderSnapshot(value: unknown): value is AdminOrderEmailSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AdminOrderEmailSnapshot).orderNumber === "number" &&
    Array.isArray((value as AdminOrderEmailSnapshot).items)
  );
}

function orderDetailsHtml(
  order: AdminOrderEmailSnapshot,
  storefrontSiteUrl: string,
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
    emailDetailRow(
      "Phone",
      emailContactLinksHtml(order.customerPhone),
    ),
    emailDetailRow(
      "Email",
      order.customerEmail
        ? `<a href="mailto:${order.customerEmail}" style="color:${C.label};text-decoration:none;">${escapeHtml(order.customerEmail)}</a>`
        : "—",
    ),
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
    ${buildOrderLineItemsTableHtml(order.items, {
      subtotalPkr: order.subtotalPkr,
      discountPkr: order.discountPkr,
      totalPkr: order.totalPkr,
    }, { siteUrl: storefrontSiteUrl })}
  </div>`;
}

type ReviewEmailPayload = {
  productTitle: string;
  productSlug: string;
  authorName: string;
  rating: number;
  body: string;
  contactPhone: string | null;
  contactEmail: string | null;
  isPublished: boolean;
};

function isReviewPayload(p: Record<string, unknown>): p is ReviewEmailPayload {
  return (
    typeof p.productTitle === "string" &&
    typeof p.authorName === "string" &&
    typeof p.rating === "number" &&
    typeof p.body === "string"
  );
}

function reviewDetailsHtml(p: ReviewEmailPayload): string {
  const rows: string[] = [
    emailDetailRow("Product", escapeHtml(p.productTitle)),
    emailDetailRow("Reviewer", escapeHtml(p.authorName)),
    emailDetailRow("Rating", emailStarRatingHtml(p.rating)),
    emailDetailRow(
      "Phone",
      p.contactPhone ? emailContactLinksHtml(p.contactPhone) : "—",
    ),
    emailDetailRow(
      "Email",
      p.contactEmail
        ? `<a href="mailto:${escapeHtml(p.contactEmail)}" style="color:${C.label};text-decoration:none;">${escapeHtml(p.contactEmail)}</a>`
        : "—",
    ),
    emailDetailRow(
      "Status",
      p.isPublished ? "Published" : "Pending moderation",
    ),
  ];

  return `<table role="presentation" class="email-inset" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bgInset}" style="margin:20px 0 0;background-color:${C.bgInset};border:1px solid ${C.border};border-radius:4px;">
    <tr>
      <td style="padding:14px 16px;">
        <p style="margin:0 0 10px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${C.label};">Review details</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>
        <div style="margin:16px 0 0;padding:14px 16px;border-left:3px solid ${C.label};background-color:${C.bgCard};border-radius:0 4px 4px 0;">
          <p style="margin:0 0 6px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${C.textMuted};">Customer wrote</p>
          <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.text};white-space:pre-wrap;">${escapeHtml(p.body)}</p>
        </div>
      </td>
    </tr>
  </table>`;
}

function buildReviewPlainText(p: ReviewEmailPayload): string {
  const lines = [
    `Product: ${p.productTitle}`,
    `Reviewer: ${p.authorName}`,
    `Rating: ${p.rating}/5`,
    p.contactPhone ? `Phone: ${p.contactPhone}` : null,
    p.contactEmail ? `Email: ${p.contactEmail}` : null,
    "",
    p.body,
  ].filter((line): line is string => line != null);
  return lines.join("\n");
}

function detailRows(ctx: AdminNotificationEmailContext): string {
  const p = ctx.payload ?? {};

  if (isOrderSnapshot(p.order)) {
    const extras =
      typeof p.fromStatus === "string" && typeof p.toStatus === "string"
        ? { fromStatus: p.fromStatus, toStatus: p.toStatus }
        : undefined;
    return orderDetailsHtml(p.order, ctx.storefrontSiteUrl, extras);
  }

  if (ctx.type === "review.submitted" && isReviewPayload(p)) {
    return reviewDetailsHtml(p);
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
  const reviewPayload =
    ctx.type === "review.submitted" && isReviewPayload(ctx.payload ?? {})
      ? (ctx.payload as ReviewEmailPayload)
      : null;

  const text = orderSnapshot
    ? `${ctx.title}\n\n${buildAdminOrderPlainTextFromContext(ctx)}\n\n${actionUrl}\n\n— Lagari Admin`
    : reviewPayload
      ? `${ctx.title}\n\n${buildReviewPlainText(reviewPayload)}\n\n${actionUrl}\n\n— Lagari Admin`
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
    storefrontSiteUrl: ctx.storefrontSiteUrl,
  });
}
