import webpush from "web-push";
import { env, isWebPushConfigured } from "../config/env";
import { CustomerPushSubscription } from "../db/models";

let vapidReady = false;

function ensureVapid(): boolean {
  if (!isWebPushConfigured()) return false;
  if (!vapidReady) {
    webpush.setVapidDetails(
      env.webPush.subject,
      env.webPush.publicKey,
      env.webPush.privateKey,
    );
    vapidReady = true;
  }
  return true;
}

export async function sendPushToSubscriptions(
  subscriptions: CustomerPushSubscription[],
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!ensureVapid() || !subscriptions.length) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await sub.destroy();
        } else {
          console.error("web push failed:", err);
        }
      }
    }),
  );
}
