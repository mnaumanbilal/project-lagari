"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics/event-buffer";
import { USE_API } from "@/lib/api/config";
import * as cartApi from "@/lib/api/cart";
import { withSessionRetry } from "@/lib/api/with-session-retry";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/site/placeholder-image";
import type { CatalogProduct } from "@/lib/types/catalog";
import { useSession } from "@/lib/session/session-context";

const FALLBACK_IMAGE = PRODUCT_PLACEHOLDER_IMAGE;

export type CartLine = {
  variantId: string;
  productSlug: string;
  productTitle: string;
  variantName: string;
  unitPricePkr: number;
  quantity: number;
  imageUrl: string;
};

type CartContextValue = {
  lines: CartLine[];
  subtotalPkr: number;
  itemCount: number;
  ready: boolean;
  addItem: (
    product: CatalogProduct,
    variantId: string,
    quantity?: number,
  ) => Promise<void>;
  setQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function mapApiCart(
  cart: cartApi.ApiCart,
  imageByVariant: Record<string, string>,
  slugByVariant: Record<string, string>,
): CartLine[] {
  return cart.items.map((item) => {
    const imageUrl =
      item.imageUrl ??
      imageByVariant[item.variantId] ??
      FALLBACK_IMAGE;
    const productSlug =
      item.productSlug || slugByVariant[item.variantId] || "";
    return {
      variantId: item.variantId,
      productSlug,
      productTitle: item.productTitle,
      variantName: item.variantName,
      unitPricePkr: item.unitPricePkr,
      quantity: item.quantity,
      imageUrl,
    };
  });
}

function mapsFromCartItems(
  items: cartApi.ApiCartItem[],
): {
  images: Record<string, string>;
  slugs: Record<string, string>;
} {
  const images: Record<string, string> = {};
  const slugs: Record<string, string> = {};
  for (const item of items) {
    if (item.imageUrl) images[item.variantId] = item.imageUrl;
    if (item.productSlug) slugs[item.variantId] = item.productSlug;
  }
  return { images, slugs };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { sessionId, ready: sessionReady, ensureSession, refreshSession } = useSession();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [subtotalPkr, setSubtotalPkr] = useState(0);
  const [imageByVariant, setImageByVariant] = useState<Record<string, string>>(
    {},
  );
  const [slugByVariant, setSlugByVariant] = useState<Record<string, string>>(
    {},
  );
  const [cartReady, setCartReady] = useState(!USE_API);

  const imageByVariantRef = useRef(imageByVariant);
  const slugByVariantRef = useRef(slugByVariant);
  imageByVariantRef.current = imageByVariant;
  slugByVariantRef.current = slugByVariant;

  const applyCartWithMaps = useCallback(
    (
      cart: cartApi.ApiCart,
      images: Record<string, string>,
      slugs: Record<string, string>,
    ) => {
      imageByVariantRef.current = images;
      slugByVariantRef.current = slugs;
      setImageByVariant(images);
      setSlugByVariant(slugs);
      setLines(mapApiCart(cart, images, slugs));
      setSubtotalPkr(cart.subtotalPkr);
    },
    [],
  );

  const runCartOp = useCallback(
    (op: (sessionId: string) => Promise<cartApi.ApiCart>) =>
      withSessionRetry(ensureSession, refreshSession, op),
    [ensureSession, refreshSession],
  );

  useEffect(() => {
    if (!USE_API) return;
    if (!sessionId) {
      // Prefetch is optional — don't block add-to-bag while session initialises.
      setCartReady(true);
      return;
    }

    let cancelled = false;
    runCartOp((id) => cartApi.fetchCart(id))
      .then((cart) => {
        if (!cancelled) {
          const { images, slugs } = mapsFromCartItems(cart.items);
          const mergedImages = { ...imageByVariantRef.current, ...images };
          const mergedSlugs = { ...slugByVariantRef.current, ...slugs };
          applyCartWithMaps(cart, mergedImages, mergedSlugs);
        }
      })
      .catch(() => {
        if (!cancelled) setLines([]);
      })
      .finally(() => {
        if (!cancelled) setCartReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, runCartOp, applyCartWithMaps]);

  const itemCount = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  );

  const addItem = useCallback(
    async (product: CatalogProduct, variantId: string, quantity = 1) => {
      const variant = product.variants?.find((v) => v.id === variantId);
      if (!variant || (variant.inStock === false && (variant.stock ?? 0) < 1)) {
        return;
      }

      const maxStock = Math.max(0, variant.stock ?? 99);
      const hero = product.heroImageUrl ?? FALLBACK_IMAGE;
      const nextImages = { ...imageByVariantRef.current, [variantId]: hero };
      const nextSlugs = { ...slugByVariantRef.current, [variantId]: product.slug };

      if (USE_API) {
        const existing = lines.find((l) => l.variantId === variantId);
        const targetQty = Math.min(
          (existing?.quantity ?? 0) + quantity,
          maxStock,
        );
        const cart = await runCartOp((id) =>
          cartApi.addToCart(id, variantId, targetQty),
        );
        const { images, slugs } = mapsFromCartItems(cart.items);
        const mergedImages = { ...nextImages, ...images };
        const mergedSlugs = { ...nextSlugs, ...slugs };
        applyCartWithMaps(cart, mergedImages, mergedSlugs);
        trackAddToCart({
          productSlug: product.slug,
          variantId,
          qty: quantity,
        });
        return;
      }

      setImageByVariant(nextImages);
      setSlugByVariant(nextSlugs);
      imageByVariantRef.current = nextImages;
      slugByVariantRef.current = nextSlugs;

      setLines((prev) => {
        const existing = prev.find((l) => l.variantId === variantId);
        const maxStock = variant.stock ?? 99;
        if (existing) {
          const next = prev.map((l) =>
            l.variantId === variantId
              ? {
                  ...l,
                  quantity: Math.min(l.quantity + quantity, maxStock),
                }
              : l,
          );
          setSubtotalPkr(
            next.reduce((s, l) => s + l.unitPricePkr * l.quantity, 0),
          );
          return next;
        }
        const next = [
          ...prev,
          {
            variantId,
            productSlug: product.slug,
            productTitle: product.title,
            variantName: variant.name,
            unitPricePkr: variant.pricePkr,
            quantity,
            imageUrl: hero,
          },
        ];
        setSubtotalPkr(
          next.reduce((s, l) => s + l.unitPricePkr * l.quantity, 0),
        );
        return next;
      });
    },
    [lines, runCartOp, applyCartWithMaps],
  );

  const setQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      if (USE_API) {
        if (quantity < 1) {
          const cart = await runCartOp((id) =>
            cartApi.removeFromCart(id, variantId),
          );
          const { images, slugs } = mapsFromCartItems(cart.items);
          const mergedImages = { ...imageByVariantRef.current, ...images };
          const mergedSlugs = { ...slugByVariantRef.current, ...slugs };
          applyCartWithMaps(cart, mergedImages, mergedSlugs);
          trackRemoveFromCart({
            variantId,
            productSlug: slugByVariantRef.current[variantId],
          });
          return;
        }
        const cart = await runCartOp((id) =>
          cartApi.addToCart(id, variantId, quantity),
        );
        const { images, slugs } = mapsFromCartItems(cart.items);
        const mergedImages = { ...imageByVariantRef.current, ...images };
        const mergedSlugs = { ...slugByVariantRef.current, ...slugs };
        applyCartWithMaps(cart, mergedImages, mergedSlugs);
        return;
      }

      if (quantity < 1) {
        setLines((prev) => {
          const next = prev.filter((l) => l.variantId !== variantId);
          setSubtotalPkr(
            next.reduce((s, l) => s + l.unitPricePkr * l.quantity, 0),
          );
          return next;
        });
        return;
      }
      setLines((prev) => {
        const next = prev.map((l) =>
          l.variantId === variantId ? { ...l, quantity } : l,
        );
        setSubtotalPkr(
          next.reduce((s, l) => s + l.unitPricePkr * l.quantity, 0),
        );
        return next;
      });
    },
    [runCartOp, applyCartWithMaps],
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      if (USE_API) {
        const cart = await runCartOp((id) =>
          cartApi.removeFromCart(id, variantId),
        );
        const { images, slugs } = mapsFromCartItems(cart.items);
        const mergedImages = { ...imageByVariantRef.current, ...images };
        const mergedSlugs = { ...slugByVariantRef.current, ...slugs };
        applyCartWithMaps(cart, mergedImages, mergedSlugs);
        trackRemoveFromCart({
          variantId,
          productSlug: slugByVariantRef.current[variantId],
        });
        return;
      }
      setLines((prev) => {
        const next = prev.filter((l) => l.variantId !== variantId);
        setSubtotalPkr(
          next.reduce((s, l) => s + l.unitPricePkr * l.quantity, 0),
        );
        return next;
      });
    },
    [runCartOp, applyCartWithMaps],
  );

  const clearCart = useCallback(() => {
    setLines([]);
    setSubtotalPkr(0);
  }, []);

  const value = useMemo(
    () => ({
      lines,
      subtotalPkr,
      itemCount,
      ready: cartReady && sessionReady,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [
      lines,
      subtotalPkr,
      itemCount,
      cartReady,
      sessionReady,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
