/** Shared Lagari email theme — matches lagari-fe/app/globals.css */
export const C = {
  bgOuter: "#0a0908",
  bgCard: "#141210",
  bgInset: "#1c1916",
  border: "#2e2a24",
  text: "#f5f0e8",
  textMuted: "#a39e94",
  label: "#c9a962",
  btnBg: "#c9a962",
  btnText: "#0a0908",
  danger: "#c45c4a",
} as const;

export const FONT =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif";

export function emailDocumentHead(): string {
  return `<!DOCTYPE html>
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
}

export function emailButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;font-family:${FONT};">
  <tr>
    <td align="center" bgcolor="${C.btnBg}" style="border-radius:4px;background-color:${C.btnBg};">
      <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;font-family:${FONT};font-size:14px;font-weight:600;color:${C.btnText};text-decoration:none;letter-spacing:0.04em;text-transform:uppercase;">${label}</a>
    </td>
  </tr>
</table>`;
}

export function emailDetailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px 8px 0;font-family:${FONT};font-size:13px;color:${C.textMuted};vertical-align:top;white-space:nowrap;">${label}</td>
    <td style="padding:8px 0;font-family:${FONT};font-size:14px;color:${C.text};vertical-align:top;">${value}</td>
  </tr>`;
}

export function emailLayout(innerHtml: string): string {
  return `${emailDocumentHead()}
<body style="margin:0;padding:0;background-color:${C.bgOuter};font-family:${FONT};">
  <table role="presentation" class="email-outer" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bgOuter}" style="background-color:${C.bgOuter};">
    <tr>
      <td align="center" bgcolor="${C.bgOuter}" style="padding:32px 16px;background-color:${C.bgOuter};">
        <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bgCard}" style="max-width:560px;background-color:${C.bgCard};border:1px solid ${C.border};border-radius:6px;">
          <tr>
            <td bgcolor="${C.bgCard}" style="padding:28px 24px 32px;font-family:${FONT};background-color:${C.bgCard};">
              ${innerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function absoluteUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function formatPkrEmail(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

/** Row for order line-item tables in customer + admin emails. */
export type EmailOrderLineItem = {
  title: string;
  variant: string;
  productSlug?: string | null;
  quantity: number;
  unitPricePkr: number;
  lineTotalPkr: number;
};

export type EmailOrderLineTotals = {
  subtotalPkr: number;
  discountPkr: number;
  totalPkr: number;
};

function emailLineItemTitleHtml(
  title: string,
  productSlug: string | null | undefined,
  siteUrl: string | undefined,
): string {
  const slug = productSlug?.trim();
  if (!slug || !siteUrl) {
    return title;
  }
  const href = `${siteUrl.replace(/\/$/, "")}/product/${slug}`;
  return `<a href="${href}" style="color:${C.text};text-decoration:none;font-weight:500;">${title}</a>`;
}

function emailNumStyle(extra = ""): string {
  return `font-family:${FONT};font-variant-numeric:tabular-nums;font-weight:600;color:${C.text};${extra}`;
}

/**
 * Shared line-items table: Item · unit price · qty · line total, then subtotal /
 * discount / order total in the footer.
 */
export function buildOrderLineItemsTableHtml(
  items: EmailOrderLineItem[],
  totals: EmailOrderLineTotals,
  options?: { siteUrl?: string },
): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 8px 10px 0;border-bottom:1px solid ${C.border};font-family:${FONT};color:${C.text};font-size:14px;font-weight:500;">
            ${emailLineItemTitleHtml(item.title, item.productSlug, options?.siteUrl)}<br><span style="color:${C.textMuted};font-size:13px;font-weight:400;">${item.variant}</span>
          </td>
          <td style="padding:10px 4px;border-bottom:1px solid ${C.border};text-align:right;white-space:nowrap;${emailNumStyle("font-size:14px;font-weight:500;")}">${formatPkrEmail(item.unitPricePkr)}</td>
          <td style="padding:10px 4px;border-bottom:1px solid ${C.border};text-align:center;${emailNumStyle("font-size:14px;font-weight:500;")}">×${item.quantity}</td>
          <td style="padding:10px 0 10px 4px;border-bottom:1px solid ${C.border};text-align:right;white-space:nowrap;${emailNumStyle("font-size:14px;")}">${formatPkrEmail(item.lineTotalPkr)}</td>
        </tr>`,
    )
    .join("");

  const discountRow =
    totals.discountPkr > 0
      ? `<tr>
          <td colspan="3" align="right" style="padding:8px 8px 0 0;color:${C.textMuted};font-size:13px;font-family:${FONT};">Discount</td>
          <td align="right" style="padding:8px 0 0;white-space:nowrap;font-family:${FONT};font-size:13px;color:${C.textMuted};">−${formatPkrEmail(totals.discountPkr)}</td>
        </tr>`
      : "";

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;font-family:${FONT};">
    <thead>
      <tr>
        <th align="left" style="color:${C.label};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:10px;font-family:${FONT};">Item</th>
        <th align="right" style="color:${C.label};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:10px;font-family:${FONT};">Unit</th>
        <th style="color:${C.label};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:10px;font-family:${FONT};">Qty</th>
        <th align="right" style="color:${C.label};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:10px;font-family:${FONT};">Line total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3" align="right" style="padding:12px 8px 0 0;color:${C.textMuted};font-size:13px;font-family:${FONT};">Subtotal</td>
        <td align="right" style="padding:12px 0 0;white-space:nowrap;font-family:${FONT};font-size:13px;color:${C.text};">${formatPkrEmail(totals.subtotalPkr)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td colspan="3" align="right" style="padding:10px 8px 0 0;color:${C.label};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;font-family:${FONT};">Order total</td>
        <td align="right" style="padding:10px 0 0;white-space:nowrap;${emailNumStyle("font-size:18px;")}">${formatPkrEmail(totals.totalPkr)}</td>
      </tr>
    </tfoot>
  </table>`;
}

export function formatOrderLineItemsPlainText(
  items: EmailOrderLineItem[],
  totals: EmailOrderLineTotals,
  options?: { siteUrl?: string },
): string {
  const lines = items.map((item) => {
    const base = `• ${item.title} (${item.variant}) — ${formatPkrEmail(item.unitPricePkr)} × ${item.quantity} = ${formatPkrEmail(item.lineTotalPkr)}`;
    const slug = item.productSlug?.trim();
    if (!slug || !options?.siteUrl) return base;
    return `${base}\n  ${options.siteUrl.replace(/\/$/, "")}/product/${slug}`;
  });

  lines.push(
    "",
    `Subtotal: ${formatPkrEmail(totals.subtotalPkr)}`,
  );
  if (totals.discountPkr > 0) {
    lines.push(`Discount: −${formatPkrEmail(totals.discountPkr)}`);
  }
  lines.push(`Order total: ${formatPkrEmail(totals.totalPkr)}`);

  return lines.join("\n");
}
