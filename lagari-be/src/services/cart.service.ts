import { env } from "../config/env";
import { cacheDel, cacheGet, cacheSet } from "../lib/redis";

export interface CartLine {
  variantId: string;
  productTitle: string;
  productSlug: string;
  variantName: string;
  quantity: number;
  unitPricePkr: number;
  imageUrl?: string;
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

function mergeCartLines(existing: CartLine[], incoming: CartLine[]): CartLine[] {
  const byVariant = new Map<string, CartLine>();
  for (const line of existing) {
    byVariant.set(line.variantId, { ...line });
  }
  for (const line of incoming) {
    const prev = byVariant.get(line.variantId);
    if (!prev) {
      byVariant.set(line.variantId, { ...line });
      continue;
    }
    byVariant.set(line.variantId, {
      ...prev,
      ...line,
      quantity: Math.max(prev.quantity, line.quantity),
      imageUrl: line.imageUrl ?? prev.imageUrl,
      productSlug: line.productSlug || prev.productSlug,
    });
  }
  return Array.from(byVariant.values());
}

/** Move cart lines from an expired session into the active session. */
export async function migrateCart(
  fromSessionId: string,
  toSessionId: string,
): Promise<void> {
  if (!fromSessionId || fromSessionId === toSessionId) return;

  const fromCart = await getCart(fromSessionId);
  if (!fromCart.items.length) return;

  const toCart = await getCart(toSessionId);
  const items = mergeCartLines(toCart.items, fromCart.items);
  const payload = { items, subtotalPkr: computeSubtotal(items) };
  await saveCart(toSessionId, payload);
  await clearCart(fromSessionId);
}
