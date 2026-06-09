"use client";

import Link from "next/link";
import { useState } from "react";
import { LagariLogo } from "@/components/brand/LagariLogo";
import { USE_API } from "@/lib/api/config";
import { placeCodOrder } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import { withSessionRetry } from "@/lib/api/with-session-retry";
import { markCheckoutPlaced } from "@/lib/analytics/checkout-placed";
import { trackOrderPlaced } from "@/lib/analytics/event-buffer";
import { CheckoutAnalytics } from "@/components/storefront/CheckoutAnalytics";
import { CheckoutSuggestions } from "@/components/storefront/CheckoutSuggestions";
import { CartPanel } from "@/components/storefront/CartPanel";
import { useCart } from "@/lib/cart/cart-context";
import { useSession } from "@/lib/session/session-context";

const PK_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Sialkot",
];

export function CheckoutForm() {
  const { lines, clearCart, ready } = useCart();
  const { ensureSession, refreshSession } = useSession();
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-lagari-muted">
        Preparing checkout…
      </div>
    );
  }

  if (lines.length === 0 && !submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <p className="font-display text-2xl text-lagari-primary">Your bag is empty</p>
        <Link
          href="/shop"
          className="mt-6 inline-block font-label text-lagari-brass hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <LagariLogo linked={false} className="mx-auto" />
        <p className="font-display mt-8 text-2xl text-lagari-primary">
          Order received
        </p>
        {orderNumber != null && (
          <p className="mt-2 font-label text-lagari-brass">
            Order #{orderNumber}
          </p>
        )}
        <p className="mt-4 text-sm text-lagari-muted">
          Our team will contact you shortly to confirm your COD shipment.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block font-label text-lagari-brass hover:underline"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-5 lg:py-14">
      <CheckoutAnalytics />
      <form
        className="lg:col-span-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setSubmitting(true);

          const form = new FormData(e.currentTarget);
          const emailRaw = String(form.get("email") ?? "").trim();
          const body = {
            fullName: String(form.get("fullName")),
            phone: String(form.get("phone")),
            city: String(form.get("city")),
            address: String(form.get("address")),
            ...(emailRaw ? { email: emailRaw } : {}),
          };

          try {
            if (USE_API) {
              const order = await withSessionRetry(
                ensureSession,
                refreshSession,
                (id) => placeCodOrder(id, body),
              );
              setOrderNumber(order.orderNumber);
              markCheckoutPlaced();
              trackOrderPlaced(order.orderId);
            }
            clearCart();
            setSubmitted(true);
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Could not place order. Please try again.",
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <h1 className="font-display text-3xl font-semibold text-lagari-primary sm:text-4xl">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-lagari-muted">
          Cash on delivery — guest checkout, no account.
        </p>

        {error && (
          <p className="mt-4 rounded-sm border border-lagari-danger/50 bg-lagari-danger/10 px-4 py-3 text-sm text-lagari-danger">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="font-label text-lagari-brass-dim">Full name</span>
            <input
              required
              name="fullName"
              className="lagari-field mt-2 w-full rounded-sm border border-lagari-border bg-lagari-surface px-4 py-3.5 text-lagari-primary outline-none transition-colors focus:border-lagari-brass"
              placeholder="Your name"
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className="font-label text-lagari-brass-dim">Mobile</span>
            <input
              required
              name="phone"
              type="tel"
              className="lagari-field mt-2 w-full rounded-sm border border-lagari-border bg-lagari-surface px-4 py-3.5 text-lagari-primary outline-none transition-colors focus:border-lagari-brass"
              placeholder="03XX XXXXXXX"
              autoComplete="tel"
            />
          </label>
          <label className="block">
            <span className="font-label text-lagari-brass-dim">Email (optional)</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              className="lagari-field mt-2 w-full rounded-sm border border-lagari-border bg-lagari-surface px-4 py-3.5 text-lagari-primary outline-none transition-colors focus:border-lagari-brass"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="font-label text-lagari-brass-dim">City</span>
            <select
              required
              name="city"
              className="lagari-field mt-2 w-full rounded-sm border border-lagari-border bg-lagari-surface px-4 py-3.5 text-lagari-primary outline-none transition-colors focus:border-lagari-brass"
              autoComplete="address-level2"
              defaultValue=""
            >
              <option value="" disabled>
                Select city
              </option>
              {PK_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-label text-lagari-brass-dim">Address</span>
            <textarea
              required
              name="address"
              rows={3}
              className="lagari-field mt-2 w-full resize-y rounded-sm border border-lagari-border bg-lagari-surface px-4 py-3.5 text-lagari-primary outline-none transition-colors focus:border-lagari-brass"
              placeholder="House, street, area"
              autoComplete="street-address"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-10 w-full rounded-sm border border-lagari-brass bg-lagari-brass py-4 font-label text-lagari-deep transition-colors hover:bg-transparent hover:text-lagari-brass disabled:opacity-50 sm:max-w-md"
        >
          {submitting ? "Placing order…" : "Place COD order"}
        </button>
      </form>

      <aside className="space-y-6 lg:col-span-2">
        <div className="rounded-sm border border-lagari-border bg-lagari-surface p-6">
          <CartPanel variant="checkout" />
        </div>
        <CheckoutSuggestions />
      </aside>
    </div>
  );
}
