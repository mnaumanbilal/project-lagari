# Customer order notifications

Transactional email updates for shoppers when order status changes.

## Email

Sent via Gmail SMTP when the customer provided an email at checkout.

| Event | When |
|-------|------|
| Order received | COD checkout completes |
| Confirmed | Admin confirms order |
| Dispatched | Admin marks shipped (includes courier + tracking) |
| Delivered | Admin marks delivered |
| Cancelled | Admin cancels (optional `cancelReason` in email) |
| RTO | Admin marks return-to-origin |

Templates: `lagari-be/src/templates/customer-order-email.ts`

Each email includes:
- Line items with **order total** below the table
- WhatsApp contact footer (+92 321 0911174, opens WhatsApp DM)
- **lagari.pk** link → `PUBLIC_SITE_URL` (production domain, not localhost)

## Browser (Web Push)

**Disabled for now.** Push subscribe routes and DB table remain for a future re-enable.

## Environment (`lagari-be/.env`)

```
PUBLIC_SITE_URL=https://www.lagari.pk
WHATSAPP_PHONE=+92 321 0911174
WHATSAPP_URL=https://wa.me/923210911174
```

## Limitations (MVP)

- No email without address at checkout
- SMS/WhatsApp outbound notifications not implemented (WhatsApp is contact-only in email footer)
