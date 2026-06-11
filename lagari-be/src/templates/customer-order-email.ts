import type { OrderStatus } from "../db/models";

export type OrderEmailLine = {
  title: string;
  variant: string;
  quantity: number;
  lineTotalPkr: number;
};

export type OrderEmailContext = {
  orderNumber: number;
  customerName: string;
  status: OrderStatus | "placed";
  totalPkr: number;
  shippingCity: string;
  shippingAddress: string;
  items: OrderEmailLine[];
  courierName?: string | null;
  trackingNumber?: string | null;
  cancelReason?: string | null;
  siteUrl: string;
  whatsappPhone: string;
  whatsappHref: string;
};

/** Lagari theme palette — matches lagari-fe/app/globals.css (solid hex for email clients) */
const C = {
  bgOuter: "#0a0908",
  bgCard: "#141210",
  bgInset: "#1c1916",
  border: "#2e2a24",
  text: "#f5f0e8",
  textMuted: "#a39e94",
  label: "#c9a962",
  amount: "#f5f0e8",
  dangerBorder: "#8b4a3e",
} as const;

const EMAIL_HEAD = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    body, .email-outer, .email-card, .email-inset {
      -webkit-text-size-adjust: 100%;
    }
    @media (prefers-color-scheme: light), (prefers-color-scheme: dark) {
      body, .email-outer { background-color: ${C.bgOuter} !important; }
      .email-card { background-color: ${C.bgCard} !important; }
      .email-inset { background-color: ${C.bgInset} !important; }
      .email-text { color: ${C.text} !important; }
      .email-muted { color: ${C.textMuted} !important; }
    }
  </style>
</head>`;

const FONT =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif";

const STATUS_COPY: Record<
  OrderEmailContext["status"],
  { subject: (n: number) => string; headline: string; lead: string }
> = {
  placed: {
    subject: (n) => `Lagari — Order #${n} received`,
    headline: "We received your order",
    lead: "Thank you for shopping with Lagari. Our team will confirm your COD order shortly.",
  },
  pending: {
    subject: (n) => `Lagari — Order #${n} received`,
    headline: "We received your order",
    lead: "Thank you for shopping with Lagari. Our team will confirm your COD order shortly.",
  },
  confirmed: {
    subject: (n) => `Lagari — Order #${n} confirmed`,
    headline: "Your order is confirmed",
    lead: "We're preparing your fragrances for dispatch. You'll get another update when it ships.",
  },
  shipped: {
    subject: (n) => `Lagari — Order #${n} dispatched`,
    headline: "Your order is on the way",
    lead: "Your package has left our studio. Tracking details are below.",
  },
  delivered: {
    subject: (n) => `Lagari — Order #${n} delivered`,
    headline: "Delivered",
    lead: "We hope you love your Lagari impressions. Thank you for your order.",
  },
  cancelled: {
    subject: (n) => `Lagari — Order #${n} cancelled`,
    headline: "Order cancelled",
    lead: "Your order was cancelled.",
  },
  rto: {
    subject: (n) => `Lagari — Order #${n} return to origin`,
    headline: "Delivery could not be completed",
    lead: "The courier could not deliver your order. Our team may reach out to arrange redelivery.",
  },
};

function formatPkr(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

function numStyle(extra = ""): string {
  return `font-family:${FONT};font-variant-numeric:tabular-nums;font-weight:600;color:${C.amount};${extra}`;
}

function itemsTableHtml(items: OrderEmailLine[], orderTotalPkr: number): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid ${C.border};font-family:${FONT};color:${C.text};font-size:14px;font-weight:500;">
            ${item.title}<br><span style="color:${C.textMuted};font-size:13px;font-weight:400;">${item.variant}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${C.border};text-align:center;${numStyle("font-size:14px;")}">×${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${C.border};text-align:right;${numStyle("font-size:14px;")}">${formatPkr(item.lineTotalPkr)}</td>
        </tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;font-family:${FONT};">
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
        <td colspan="2" align="right" style="padding:14px 8px 0 0;color:${C.label};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;font-family:${FONT};">Order total</td>
        <td align="right" style="padding:14px 0 0;${numStyle("font-size:18px;")}">${formatPkr(orderTotalPkr)}</td>
      </tr>
    </tfoot>
  </table>`;
}

function contactFooterHtml(ctx: OrderEmailContext): string {
  return `<p style="margin:28px 0 0;font-family:${FONT};font-size:14px;color:${C.textMuted};line-height:1.6;">
      Questions? Message us on WhatsApp:<br>
      <a href="${ctx.whatsappHref}" style="color:${C.label};text-decoration:none;font-weight:600;font-family:${FONT};">${ctx.whatsappPhone}</a>
    </p>`;
}

function contactFooterText(ctx: OrderEmailContext): string {
  return `Questions? WhatsApp us at ${ctx.whatsappPhone}\n${ctx.whatsappHref}`;
}

export function buildCustomerOrderEmail(ctx: OrderEmailContext): {
  subject: string;
  text: string;
  html: string;
} {
  const statusKey = ctx.status === "placed" ? "placed" : ctx.status;
  const copy = STATUS_COPY[statusKey] ?? STATUS_COPY.pending;

  const trackingBlock =
    ctx.status === "shipped" && ctx.courierName && ctx.trackingNumber
      ? `\nCourier: ${ctx.courierName}\nTracking: ${ctx.trackingNumber}\n`
      : "";

  const cancelReasonBlock =
    ctx.status === "cancelled" && ctx.cancelReason
      ? `\nReason: ${ctx.cancelReason}\n`
      : "";

  const itemsText = ctx.items
    .map((i) => `• ${i.title} (${i.variant}) ×${i.quantity} — ${formatPkr(i.lineTotalPkr)}`)
    .join("\n");

  const text = `Hi ${ctx.customerName},

${copy.headline}

${copy.lead}

Order #${ctx.orderNumber}
Ship to: ${ctx.shippingAddress}, ${ctx.shippingCity}
${trackingBlock}${cancelReasonBlock}
Items:
${itemsText}

Order total: ${formatPkr(ctx.totalPkr)}

${contactFooterText(ctx)}

— Lagari
${ctx.siteUrl}`;

  const trackingHtml =
    ctx.status === "shipped" && ctx.courierName && ctx.trackingNumber
      ? `<div class="email-inset" style="margin:16px 0;padding:14px 16px;background-color:${C.bgInset};border:1px solid ${C.border};border-radius:4px;font-family:${FONT};">
          <p style="margin:0 0 6px;font-size:14px;color:${C.text};"><strong style="color:${C.label};">Courier:</strong> ${ctx.courierName}</p>
          <p style="margin:0;font-size:14px;color:${C.text};"><strong style="color:${C.label};">Tracking:</strong> <span style="${numStyle()}">${ctx.trackingNumber}</span></p>
        </div>`
      : "";

  const cancelReasonHtml =
    ctx.status === "cancelled" && ctx.cancelReason
      ? `<div class="email-inset" style="margin:16px 0;padding:14px 16px;background-color:${C.bgInset};border:1px solid ${C.dangerBorder};border-radius:4px;font-family:${FONT};">
          <p style="margin:0;font-size:14px;line-height:1.55;color:${C.text};"><strong style="color:${C.label};">Reason:</strong> ${ctx.cancelReason}</p>
        </div>`
      : "";

  const html = `${EMAIL_HEAD}
<body style="margin:0;padding:0;background-color:${C.bgOuter};font-family:${FONT};">
  <table role="presentation" class="email-outer" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bgOuter}" style="background-color:${C.bgOuter};">
    <tr>
      <td align="center" bgcolor="${C.bgOuter}" style="padding:32px 16px;background-color:${C.bgOuter};">
        <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bgCard}" style="max-width:560px;background-color:${C.bgCard};border:1px solid ${C.border};border-radius:6px;">
          <tr>
            <td bgcolor="${C.bgCard}" style="padding:28px 24px 32px;font-family:${FONT};background-color:${C.bgCard};">
              <p style="margin:0 0 20px;font-size:20px;font-weight:700;letter-spacing:0.14em;color:${C.label};font-family:${FONT};">LAGARI</p>
              <h1 class="email-text" style="margin:0 0 10px;font-size:22px;font-weight:700;color:${C.text};font-family:${FONT};line-height:1.3;">${copy.headline}</h1>
              <p class="email-muted" style="margin:0 0 20px;font-size:15px;line-height:1.55;color:${C.textMuted};font-family:${FONT};">Hi ${ctx.customerName}, ${copy.lead}</p>
              <p class="email-muted" style="margin:0;font-size:14px;color:${C.textMuted};font-family:${FONT};">Order <strong style="color:${C.label};${numStyle()}">#${ctx.orderNumber}</strong></p>
              <p class="email-muted" style="margin:6px 0 0;font-size:14px;line-height:1.5;color:${C.textMuted};font-family:${FONT};">${ctx.shippingAddress}, ${ctx.shippingCity}</p>
              ${trackingHtml}
              ${cancelReasonHtml}
              ${itemsTableHtml(ctx.items, ctx.totalPkr)}
              ${contactFooterHtml(ctx)}
              <p style="margin:24px 0 0;font-size:13px;font-family:${FONT};">
                <a href="${ctx.siteUrl}" style="color:${C.label};font-weight:600;text-decoration:none;">lagari.pk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: copy.subject(ctx.orderNumber), text, html };
}
