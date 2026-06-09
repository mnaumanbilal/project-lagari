"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAdminAnalytics, type AnalyticsOverview } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";

export function AdminAnalytics() {
  const { accessToken } = useAdminAuth();
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getValidAccessToken() ?? accessToken;
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    void fetchAdminAnalytics(token, days)
      .then(setData)
      .catch((err: unknown) => {
        setData(null);
        setError(
          err instanceof Error ? err.message : "Could not load analytics.",
        );
      })
      .finally(() => setLoading(false));
  }, [accessToken, days]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Analytics</h1>
        <div className="flex gap-2">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`admin-btn rounded-sm px-4 py-2 ${
                d === days
                  ? "admin-btn-primary"
                  : "admin-card border border-lagari-border"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-lagari-muted">Loading…</p>
      ) : error ? (
        <p className="mt-8 text-lagari-danger">{error}</p>
      ) : !data ? (
        <p className="mt-8 text-lagari-muted">No analytics data.</p>
      ) : (
        <>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Unique visitors" value={String(data.uniqueVisitors)} />
            <Card label="New visitors" value={String(data.newVisitors)} />
            <Card label="Returning visitors" value={String(data.returningVisitors)} />
            <Card label="Active sessions (30m)" value={String(data.activeSessions)} />
            <Card label="Checkout conversion" value={`${data.checkoutConversionRate}%`} />
            <Card label="Cart drop-off" value={`${data.cartDropOffRate}%`} />
            <Card label="View → cart" value={`${data.viewToCartRate}%`} />
            <Card label="Overall conversion" value={`${data.overallConversionRate}%`} />
          </dl>

          <section className="admin-card mt-8 px-4 py-5">
            <h2 className="font-display text-lg font-semibold">Funnel</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <FunnelStep label="Product views" value={data.productViewSessions} />
              <FunnelStep label="Add to cart" value={data.addToCartSessions} />
              <FunnelStep label="Checkout started" value={data.checkoutStarts} />
              <FunnelStep label="Orders placed" value={data.orderPlacedSessions} />
              <FunnelStep label="Orders (DB)" value={data.ordersPlacedInRange} />
            </dl>
            <p className="mt-4 text-xs text-lagari-muted">
              Cart abandonment (added, never checked out): {data.cartAbandonmentRate}% ·
              Cart → checkout: {data.cartToCheckoutRate}% · Cancelled orders:{" "}
              {data.cancelledOrders}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Top products</h2>
            <p className="mt-1 text-xs text-lagari-muted">
              Unique viewers = distinct visitors per product in range. Total views = all
              counted product_view events after deduplication.
            </p>
            {data.topProducts.length === 0 ? (
              <p className="mt-4 text-lagari-muted">No product activity in range yet.</p>
            ) : (
              <div className="admin-card mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-right">Unique viewers</th>
                      <th className="px-4 py-3 text-right">Total views</th>
                      <th className="px-4 py-3 text-right">Add to cart</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((row) => (
                      <tr
                        key={row.productSlug}
                        className="border-b border-lagari-border/60 last:border-0"
                      >
                        <td className="px-4 py-3">
                          {row.productId ? (
                            <Link
                              href={`/admin-panel-route/products/${row.productId}/edit`}
                              className="font-medium text-lagari-primary hover:text-lagari-brass"
                            >
                              {row.productTitle}
                            </Link>
                          ) : (
                            <span className="font-medium text-lagari-primary">
                              {row.productTitle}
                            </span>
                          )}
                          <p className="mt-0.5 text-xs text-lagari-muted">
                            {row.productSlug}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">{row.uniqueViewers}</td>
                        <td className="px-4 py-3 text-right">{row.totalViews}</td>
                        <td className="px-4 py-3 text-right">
                          {row.addToCartSessions}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-3 font-label text-xs">
                            {row.productId ? (
                              <Link
                                href={`/admin-panel-route/products/${row.productId}/edit`}
                                className="text-lagari-brass hover:underline"
                              >
                                Edit
                              </Link>
                            ) : null}
                            <a
                              href={`/product/${row.productSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lagari-brass hover:underline"
                            >
                              View storefront
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {data.topSearches.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold">Top searches</h2>
              <div className="admin-card mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
                    <tr>
                      <th className="px-4 py-3">Query</th>
                      <th className="px-4 py-3 text-right">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSearches.map((row) => (
                      <tr
                        key={row.query}
                        className="border-b border-lagari-border/60 last:border-0"
                      >
                        <td className="px-4 py-3">{row.query}</td>
                        <td className="px-4 py-3 text-right">{row.uniqueSessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {data.categoryInterest.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold">Category interest</h2>
              <div className="admin-card mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
                    <tr>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categoryInterest.map((row) => (
                      <tr
                        key={row.category}
                        className="border-b border-lagari-border/60 last:border-0"
                      >
                        <td className="px-4 py-3">{row.category}</td>
                        <td className="px-4 py-3 text-right">{row.uniqueSessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-card px-4 py-5">
      <dt className="font-label text-lagari-brass-dim">{label}</dt>
      <dd className="font-display mt-2 text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="font-label text-lagari-brass-dim">{label}</dt>
      <dd className="font-display mt-1 text-xl font-semibold">{value}</dd>
    </div>
  );
}
