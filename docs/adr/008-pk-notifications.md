# ADR-008: Pakistan notifications (SMS / WhatsApp)

**Status:** Proposed — vendor TBD  
**Date:** 2026-06-04

## Context

FR-N3, FR-N4 require customer trust post-order; FR-N2 requires team Slack alerts. PK market favors SMS/WhatsApp over email.

## Decision

### Architecture

```typescript
interface NotificationProvider {
  sendOrderConfirmation(payload: OrderNotificationPayload): Promise<void>;
}
```

Implementations: `SmsProvider`, `WhatsAppProvider`, `EmailProvider`, `SlackWebhookProvider`.

Fire **async** from order controller after DB commit (V1); failures logged, do not block order creation.

### Vendor shortlist (choose one before V1)

| Channel | Options |
|---------|---------|
| SMS | Twilio, LifetimeSMS, local telco business API |
| WhatsApp | WhatsApp Business API, bSecure, Veer |
| Email | Resend / Postmark (HTML templates) |
| Admin | Slack incoming webhook |

**MVP:** No automated customer SMS — optional manual WhatsApp by ops using order phone.

## Consequences

**Positive:** Swappable providers; budget control.

**Negative:** Integration lead time — schedule in V1 sprint, not MVP.

**Action:** User to confirm preferred SMS/WhatsApp vendor before V1 implementation.
