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
