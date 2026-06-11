import { EventEmitter } from "events";
import Redis from "ioredis";
import { env } from "../config/env";
import { getRedis } from "./redis";

const CHANNEL = "lagari:admin:notifications";

export type LiveNotificationPayload = {
  id: string;
  type: string;
  title: string;
  body: string;
  linkPath: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
};

const bus = new EventEmitter();
bus.setMaxListeners(50);

let subscriber: Redis | null = null;

export function initNotificationPubSub(): void {
  const redis = getRedis();
  if (!redis || subscriber) return;

  subscriber = redis.duplicate();
  subscriber.subscribe(CHANNEL).catch((err) => {
    console.error("notification pubsub subscribe failed:", err);
  });
  subscriber.on("message", (_channel, message) => {
    try {
      const payload = JSON.parse(message) as LiveNotificationPayload;
      bus.emit("notification", payload);
    } catch {
      /* ignore malformed */
    }
  });
}

export async function publishNotification(
  payload: LiveNotificationPayload,
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.publish(CHANNEL, JSON.stringify(payload));
    return;
  }
  bus.emit("notification", payload);
}

export function onLiveNotification(
  listener: (payload: LiveNotificationPayload) => void,
): () => void {
  bus.on("notification", listener);
  return () => bus.off("notification", listener);
}
