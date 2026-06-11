import { CustomerPushSubscription } from "../db/models";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function upsertCustomerPushSubscription(input: {
  sessionId: string;
  customerId?: string | null;
  subscription: PushSubscriptionInput;
  userAgent?: string | null;
}) {
  const existing = await CustomerPushSubscription.findOne({
    where: { endpoint: input.subscription.endpoint },
  });

  if (existing) {
    await existing.update({
      sessionId: input.sessionId,
      customerId: input.customerId ?? existing.customerId,
      p256dh: input.subscription.keys.p256dh,
      auth: input.subscription.keys.auth,
      userAgent: input.userAgent ?? existing.userAgent,
    });
    return existing;
  }

  return CustomerPushSubscription.create({
    sessionId: input.sessionId,
    customerId: input.customerId ?? null,
    endpoint: input.subscription.endpoint,
    p256dh: input.subscription.keys.p256dh,
    auth: input.subscription.keys.auth,
    userAgent: input.userAgent ?? null,
  });
}

export async function removeCustomerPushSubscription(
  sessionId: string,
  endpoint: string,
): Promise<boolean> {
  const deleted = await CustomerPushSubscription.destroy({
    where: { sessionId, endpoint },
  });
  return deleted > 0;
}
