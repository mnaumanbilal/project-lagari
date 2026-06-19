/** Customer-facing contact — keep in sync with lagari-fe/lib/site/contact.ts */
export const LAGARI_CONTACT = {
  whatsappPhone: process.env.WHATSAPP_PHONE ?? "+92 321 0911174",
  whatsappHref: process.env.WHATSAPP_URL ?? "https://wa.me/923210911174",
  supportEmail:
    process.env.REPLY_TO_EMAIL ??
    process.env.ADMIN_EMAIL ??
    "lagariassistant@gmail.com",
} as const;
