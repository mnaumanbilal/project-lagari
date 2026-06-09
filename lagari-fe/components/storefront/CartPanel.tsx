"use client";

import Link from "next/link";
import { CartLineItem } from "@/components/storefront/CartLineItem";
import { formatPkr } from "@/lib/format";
import { useCart } from "@/lib/cart/cart-context";

type Props = {
  onCheckout?: () => void;
  showHeading?: boolean;
  /** On checkout page — hide redundant checkout CTA */
  variant?: "default" | "checkout";
};

export function CartPanel({
  onCheckout,
  showHeading = true,
  variant = "default",
}: Props) {
  const { lines, subtotalPkr, ready } = useCart();

  if (!ready) {
    return (
      <p className="py-8 text-center text-sm text-lagari-muted">Loading your bag…</p>
    );
  }

  if (!lines.length) {
    return (
      <div className="py-8 text-center">
        <p className="font-display text-lg text-lagari-primary">Your bag is empty</p>
        <Link
          href="/shop"
          className="mt-4 inline-block font-label text-sm text-lagari-brass hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      {showHeading && (
        <h2 className="font-label text-lagari-brass">Your bag</h2>
      )}
      <ul className={`space-y-4 ${showHeading ? "mt-6" : ""}`}>
        {lines.map((line) => (
          <CartLineItem key={line.variantId} line={line} />
        ))}
      </ul>
      <div className="mt-6 border-t border-lagari-border pt-4">
        <p className="flex items-baseline justify-between font-display text-xl text-lagari-primary">
          <span>Total</span>
          <span>{formatPkr(subtotalPkr)}</span>
        </p>
        {variant === "default" && (
          <Link
            href="/checkout"
            onClick={onCheckout}
            className="mt-4 block w-full rounded-sm border border-lagari-brass bg-lagari-brass py-3.5 text-center font-label text-lagari-deep transition-colors hover:bg-transparent hover:text-lagari-brass"
          >
            Checkout
          </Link>
        )}
        <Link
          href="/shop"
          onClick={onCheckout}
          className={`block text-center text-sm text-lagari-muted transition-colors hover:text-lagari-brass ${
            variant === "default" ? "mt-2" : "mt-4"
          }`}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
