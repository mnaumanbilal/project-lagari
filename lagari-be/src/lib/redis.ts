import Redis from "ioredis";
import { env } from "../config/env";

let client: Redis | null = null;

/** In-memory fallback when REDIS_URL is not set (local dev). */
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

export function getRedis(): Redis | null {
  if (!env.redisUrl) return null;
  if (!client) {
    client = new Redis(env.redisUrl, { maxRetriesPerRequest: 2 });
  }
  return client;
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = getRedis();
  if (redis) return redis.get(key);

  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(key, value, "EX", ttlSeconds);
    return;
  }
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(key);
    return;
  }
  memoryStore.delete(key);
}
