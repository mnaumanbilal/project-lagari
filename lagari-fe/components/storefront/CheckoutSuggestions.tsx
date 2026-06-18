"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCatalogProducts } from "@/lib/catalog/product-queries";
import { getDefaultVariant, isVariantPurchasable } from "@/lib/cart/helpers";
import { useCart } from "@/lib/cart/cart-context";
import { formatPkr } from "@/lib/format";
import { cloudinaryPresets } from "@/lib/media/cloudinary";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/site/placeholder-image";
import {
  pickCheckoutSuggestions,
  suggestionHeadline,
} from "@/lib/checkout/suggest-products";

const FALLBACK_IMAGE = cloudinaryPresets.productCard(PRODUCT_PLACEHOLDER_IMAGE);

export function CheckoutSuggestions() {
  const { lines, addItem, ready: cartReady } = useCart();
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const [addedSlug, setAddedSlug] = useState<string | null>(null);

  const { data: catalog = [] } = useQuery({
    queryKey: ["catalog", "checkout-suggestions"],
    queryFn: () => fetchCatalogProducts({}),
    staleTime: 5 * 60_000,
    enabled: lines.length > 0,
  });

  const suggestions = useMemo(
    () => pickCheckoutSuggestions(catalog, lines, 3),
    [catalog, lines],
  );

  if (!cartReady || !lines.length || suggestions.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-sm border border-lagari-border bg-lagari-surface p-5"
      aria-label="Suggested products"
    >
      <h2 className="font-label text-lagari-brass">{suggestionHeadline(lines.length)}</h2>
      <p className="mt-1 text-xs text-lagari-muted">
        Fresh picks based on what&apos;s in your bag — updates as you add more.
      </p>

      <ul className="mt-4 space-y-3">
        {suggestions.map(({ product, reason }) => {
          const variant = getDefaultVariant(product);
          const purchasable = variant && isVariantPurchasable(variant);
          const multiVariant = (product.variants?.length ?? 0) > 1;
          const image =
            cloudinaryPresets.productCard(product.heroImageUrl) || FALLBACK_IMAGE;
          const busy = addingSlug === product.slug;
          const justAdded = addedSlug === product.slug;

          return (
            <li
              key={product.slug}
              className="flex gap-3 rounded-sm border border-lagari-border/80 bg-lagari-elevated/40 p-3"
            >
              <Link
                href={`/product/${product.slug}`}
                className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-lagari-deep"
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${product.slug}`}
                  className="line-clamp-1 font-medium text-sm text-lagari-primary hover:text-lagari-brass"
                >
                  {product.title}
                </Link>
                <p className="mt-0.5 line-clamp-1 text-xs text-lagari-muted">{reason}</p>
                <p className="mt-1 text-xs text-lagari-brass-dim">
                  From {formatPkr(product.fromPricePkr)}
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                {multiVariant ? (
                  <Link
                    href={`/product/${product.slug}`}
                    className="rounded-sm border border-lagari-brass px-2.5 py-1.5 text-xs font-medium text-lagari-brass hover:bg-lagari-brass/10"
                  >
                    Choose
                  </Link>
                ) : purchasable ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (!variant) return;
                      setAddingSlug(product.slug);
                      void addItem(product, variant.id, 1)
                        .then(() => {
                          setAddedSlug(product.slug);
                          window.setTimeout(() => setAddedSlug(null), 2000);
                        })
                        .finally(() => setAddingSlug(null));
                    }}
                    className="rounded-sm border border-lagari-brass bg-lagari-brass px-2.5 py-1.5 text-xs font-medium text-lagari-deep transition-colors hover:bg-transparent hover:text-lagari-brass disabled:opacity-50"
                  >
                    {busy ? "…" : justAdded ? "Added" : "Add"}
                  </button>
                ) : (
                  <span className="text-xs text-lagari-muted">Sold out</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
