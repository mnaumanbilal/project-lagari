"use client";

import { useState } from "react";
import { ProductCartActions } from "@/components/storefront/ProductCartActions";
import { QuantityStepper } from "@/components/storefront/QuantityStepper";
import { trackVariantSelect } from "@/lib/analytics/event-buffer";
import { getMaxStock, isVariantPurchasable } from "@/lib/cart/helpers";
import { formatPkr } from "@/lib/format";
import type { CatalogProduct } from "@/lib/types/catalog";

type ProductPurchaseProps = {
  product: CatalogProduct;
};

export function ProductPurchase({ product }: ProductPurchaseProps) {
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const variant = variants.find((v) => v.id === variantId);
  const maxStock = variant ? getMaxStock(variant) : 1;

  return (
    <div className="mt-8 space-y-6">
      {variants.length > 0 && (
        <div>
          <p className="font-label mb-3 text-lagari-brass-dim">Size</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={!isVariantPurchasable(v)}
                onClick={() => {
                  setVariantId(v.id);
                  setQuantity(1);
                  trackVariantSelect(product.slug, v.id);
                }}
                className={`rounded-sm border px-4 py-2.5 text-sm transition-colors ${
                  variantId === v.id
                    ? "border-lagari-brass bg-lagari-brass/10 text-lagari-brass"
                    : "border-lagari-border text-lagari-muted hover:border-lagari-brass/50"
                } disabled:opacity-40`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {variant && (
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="font-display text-3xl font-semibold text-lagari-primary">
            {formatPkr(variant.pricePkr)}
          </p>
          {variant.compareAtPricePkr != null &&
            variant.compareAtPricePkr > variant.pricePkr && (
              <p className="text-lg text-lagari-muted line-through">
                {formatPkr(variant.compareAtPricePkr)}
              </p>
            )}
        </div>
      )}

      {variant && isVariantPurchasable(variant) && (
        <div>
          <p className="font-label mb-3 text-lagari-brass-dim">Quantity</p>
          <QuantityStepper
            value={quantity}
            min={1} 
            max={maxStock}
            onChange={setQuantity}
          />
        </div>
      )}

      <ProductCartActions
        product={product}
        variantId={variantId}
        quantity={quantity}
        layout="detail"
      />
    </div>
  );
}
