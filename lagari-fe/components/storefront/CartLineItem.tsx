"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { QuantityStepper } from "@/components/storefront/QuantityStepper";
import { formatPkr } from "@/lib/format";
import { productPath } from "@/lib/storefront/product-url";
import type { CartLine } from "@/lib/cart/cart-context";
import { useCart } from "@/lib/cart/cart-context";
import { useStorefrontToast } from "@/lib/storefront/toast-context";

type Props = {
  line: CartLine;
  compact?: boolean;
};

export function CartLineItem({ line, compact }: Props) {
  const { setQuantity, removeItem } = useCart();
  const toast = useStorefrontToast();
  const [busy, setBusy] = useState(false);

  async function updateQuantity(next: number) {
    setBusy(true);
    try {
      if (next < 1) {
        await removeItem(line.variantId);
      } else {
        await setQuantity(line.variantId, next);
      }
    } catch {
      toast.error("Could not update your bag. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const productHref = productPath(line.productSlug) ?? "/shop";

  return (
    <li className={`flex gap-4 ${compact ? "" : "border-b border-lagari-border pb-4 last:border-0 last:pb-0"}`}>
      <Link
        href={productHref}
        className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-lagari-deep"
      >
        <Image
          src={line.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="56px"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={productHref}
              className="font-medium text-lagari-primary hover:text-lagari-brass"
            >
              {line.productTitle}
            </Link>
            <p className="text-xs text-lagari-muted">{line.variantName}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void updateQuantity(0)}
            className="shrink-0 text-xs text-lagari-muted transition-colors hover:text-lagari-danger disabled:opacity-50"
            aria-label={`Remove ${line.productTitle}`}
          >
            Remove
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            min={1}
            disabled={busy}
            onChange={(n) => void updateQuantity(n)}
          />
          <p className="text-sm font-medium text-lagari-brass">
            {formatPkr(line.unitPricePkr * line.quantity)}
          </p>
        </div>
      </div>
    </li>
  );
}
