import { env } from "../config/env";
import { cacheDel, cacheGet, cacheSet } from "../lib/redis";

export interface CartLine {
  variantId: string;
  productTitle: string;
  productSlug?: string;
  variantName: string;
  quantity: number;
  unitPricePkr: number;
}

export interface CartPayload {
  items: CartLine[];
  subtotalPkr: number;
}

const cartKey = (sessionId: string) => `cart:${sessionId}`;
const ttlSeconds = env.sessionIdleMinutes * 60;

export async function getCart(sessionId: string): Promise<CartPayload> {
  const raw = await cacheGet(cartKey(sessionId));
  if (!raw) return { items: [], subtotalPkr: 0 };
  return JSON.parse(raw) as CartPayload;
}

export async function saveCart(
  sessionId: string,
  cart: CartPayload,
): Promise<void> {
  await cacheSet(cartKey(sessionId), JSON.stringify(cart), ttlSeconds);
}

export async function clearCart(sessionId: string): Promise<void> {
  await cacheDel(cartKey(sessionId));
}

export function computeSubtotal(items: CartLine[]): number {
  return items.reduce(
    (sum, line) => sum + line.unitPricePkr * line.quantity,
    0,
  );
}
