# Admin notifications

Real-time admin alerts for orders, inventory, products, and reviews.

## Channels

| Channel | Purpose |
|---------|---------|
| SSE (`GET /admin/notifications/stream`) | Live in-app toasts + sound |
| Inbox REST | History pagination (no sound) |
| Gmail SMTP | Email to `ADMIN_EMAIL` |
| Slack webhook | Optional async mirror |

## Sound policy

Every live SSE event and reconnect catch-up plays sound. Only the global **Mute** toggle in the notification bell opts out. Loading inbox history does not play sound.

## Auth

- REST + stream-token: Bearer access JWT (`requireAuth`)
- SSE: short-lived stream token from `POST /admin/notifications/stream-token` (query param; EventSource cannot send headers)

## Event types

- `order.placed` — COD checkout
- `order.status_changed` — admin status workflow
- `inventory.low_stock` — variant at/below threshold (1h dedupe per variant)
- `product.updated` — admin product save
- `review.submitted` — customer review

## Environment (`lagari-be/.env`)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_APP_PASSWORD=
EMAIL_FROM=Lagari <you@gmail.com>
ADMIN_EMAIL=
SLACK_WEBHOOK_URL=
```

Redis (`REDIS_URL`) enables multi-instance SSE fan-out; without Redis, in-process EventEmitter is used (single server).
