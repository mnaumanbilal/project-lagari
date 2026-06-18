import { apiFetch } from "./client";

export type ApiCartItem = {
  variantId: string;
  productTitle: string;
  productSlug: string;
  variantName: string;
  quantity: number;
  unitPricePkr: number;
  imageUrl?: string;
};

export type ApiCart = {
  items: ApiCartItem[];
  subtotalPkr: number;
};

export async function fetchCart(sessionId: string): Promise<ApiCart> {
  return apiFetch<ApiCart>("/cart", { sessionId, cache: "no-store" });
}

export async function addToCart(
  sessionId: string,
  variantId: string,
  quantity: number,
): Promise<ApiCart> {
  return apiFetch<ApiCart>("/cart", {
    method: "POST",
    sessionId,
    body: JSON.stringify({ variantId, quantity }),
    cache: "no-store",
  });
}

export async function removeFromCart(
  sessionId: string,
  variantId: string,
): Promise<ApiCart> {
  return apiFetch<ApiCart>(`/cart/items/${variantId}`, {
    method: "DELETE",
    sessionId,
    cache: "no-store",
  });
}

export type CodCheckoutBody = {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  email?: string;
};

export type OrderCreated = {
  orderId: string;
  orderNumber: number;
  totalPkr: number;
};

export async function placeCodOrder(
  sessionId: string,
  body: CodCheckoutBody,
  idempotencyKey?: string,
): Promise<OrderCreated> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }
  return apiFetch<OrderCreated>("/checkout/cod", {
    method: "POST",
    sessionId,
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
}
