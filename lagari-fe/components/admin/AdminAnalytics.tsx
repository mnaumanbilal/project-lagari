"use client";

import { useEffect, useState } from "react";
import { fetchAdminAnalytics, type AnalyticsOverview } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";

export function AdminAnalytics() {
  const { accessToken } = useAdminAuth();
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    const token = getValidAccessToken() ?? accessToken;
    if (!token) return;
    fetchAdminAnalytics(token, days).then(setData);
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
                days === d
                  ? "admin-btn-primary"
                  : "admin-card border border-lagari-border"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <p className="mt-8 text-lagari-muted">Loading…</p>
      ) : (
        <>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="New visitors" value={String(data.newVisitors)} />
            <Card label="Cart drop-off" value={`${data.cartDropOffRate}%`} />
            <Card label="Cancelled orders" value={String(data.cancelledOrders)} />
            <Card label="Active sessions (30m)" value={String(data.activeSessions)} />
          </dl>

          <p className="mt-4 text-sm text-lagari-muted">
            Checkout starts: {data.checkoutStarts} · Conversions: {data.checkoutConversions}
          </p>

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Top products by views</h2>
            {data.topProductsByViews.length === 0 ? (
              <p className="mt-4 text-lagari-muted">No product views in range yet.</p>
            ) : (
              <div className="admin-card mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
                    <tr>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3 text-right">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProductsByViews.map((row) => (
                      <tr key={row.productSlug} className="border-b border-lagari-border/60 last:border-0">
                        <td className="px-4 py-3">{row.productSlug}</td>
                        <td className="px-4 py-3 text-right">{row.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
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
