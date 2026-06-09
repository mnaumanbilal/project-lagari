"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDefaultVariant, isVariantPurchasable } from "@/lib/cart/helpers";
import { useCart } from "@/lib/cart/cart-context";
import { useSession } from "@/lib/session/session-context";
import type { CatalogProduct } from "@/lib/types/catalog";

type Props = {
  product: CatalogProduct;
  variantId?: string;
  quantity?: number;
  layout?: "card" | "detail";
};

export function ProductCartActions({
  product,
  variantId: variantIdProp,
  quantity = 1,
  layout = "card",
}: Props) {
  const router = useRouter();
  const { addItem, ready: cartReady } = useCart();
  const { ready: sessionReady } = useSession();
  const [loading, setLoading] = useState<"add" | "buy" | null>(null);
  const [added, setAdded] = useState(false);

  const defaultVariant = getDefaultVariant(product);
  const variantId = variantIdProp ?? defaultVariant?.id;
  const variant = product.variants?.find((v) => v.id === variantId);
  const canInteract = cartReady && sessionReady;
  const purchasable = variant && isVariantPurchasable(variant);
  const multiVariant = (product.variants?.length ?? 0) > 1 && !variantIdProp;

  async function handleAdd() {
    if (!variantId || !canInteract || !purchasable) return;
    setLoading("add");
    try {
      await addItem(product, variantId, quantity);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    } finally {
      setLoading(null);
    }
  }

  async function handleBuyNow() {
    if (!variantId || !canInteract || !purchasable) return;
    setLoading("buy");
    try {
      await addItem(product, variantId, quantity);
      router.push("/checkout");
    } finally {
      setLoading(null);
    }
  }

  if (multiVariant && layout === "card") {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href={`/product/${product.slug}`}
          className="block w-full rounded-sm border border-lagari-brass bg-lagari-brass py-2.5 text-center font-label text-xs text-lagari-deep transition-colors hover:bg-transparent hover:text-lagari-brass sm:text-sm"
        >
          Choose size
        </Link>
      </div>
    );
  }

  if (!purchasable) {
    return (
      <p className="text-center text-xs text-lagari-muted sm:text-sm">
        Out of stock
      </p>
    );
  }

  const addLabel = !canInteract
    ? "Loading…"
    : loading === "add"
      ? "Adding…"
      : added
        ? "Added"
        : "Add to bag";

  const buyLabel = !canInteract
    ? "Loading…"
    : loading === "buy"
      ? "Redirecting…"
      : "Buy it now";

  if (layout === "detail") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={!canInteract || loading !== null}
          className="flex-1 rounded-sm border border-lagari-brass bg-lagari-brass py-3.5 font-label text-lagari-deep transition-colors hover:bg-transparent hover:text-lagari-brass disabled:opacity-50"
        >
          {addLabel}
        </button>
        <button
          type="button"
          onClick={() => void handleBuyNow()}
          disabled={!canInteract || loading !== null}
          className="flex-1 rounded-sm border border-lagari-border py-3.5 font-label text-lagari-primary transition-colors hover:border-lagari-brass hover:text-lagari-brass disabled:opacity-50"
        >
          {buyLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          void handleAdd();
        }}
        disabled={!canInteract || loading !== null}
        className="flex-1 rounded-sm border border-lagari-border py-2.5 font-label text-xs text-lagari-primary transition-colors hover:border-lagari-brass hover:text-lagari-brass disabled:opacity-50 sm:text-sm"
      >
        {addLabel}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          void handleBuyNow();
        }}
        disabled={!canInteract || loading !== null}
        className="flex-1 rounded-sm border border-lagari-brass bg-lagari-brass/10 py-2.5 font-label text-xs text-lagari-brass transition-colors hover:bg-lagari-brass hover:text-lagari-deep disabled:opacity-50 sm:text-sm"
      >
        {buyLabel}
      </button>
    </div>
  );
}
