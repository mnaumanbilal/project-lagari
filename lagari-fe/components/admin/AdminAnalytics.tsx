"use client";

import Link from "next/link";
import { useState } from "react";
import type { AnalyticsRangeParams } from "@/lib/api/admin";
import { AdminAnalyticsDateFilter } from "@/components/admin/AdminAnalyticsDateFilter";
import { AdminListCard, AdminListCardField, AdminListCardFields } from "@/components/admin/AdminListCard";
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import { useAdminAnalytics } from "@/lib/admin/hooks/use-admin-queries";

export function AdminAnalytics() {
  const [range, setRange] = useState<AnalyticsRangeParams>({
    preset: "last_7_days",
  });
  const { data, error, isLoading, isFetching } = useAdminAnalytics(range);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Analytics</h1>
          {data?.label ? (
            <p className="mt-2 text-sm text-lagari-muted">{data.label}</p>
          ) : null}
        </div>
        <AdminRefreshButton queryKey={adminKeys.analytics(range)} />
      </div>

      <div className="mt-4">
        <AdminAnalyticsDateFilter
          value={range}
          onChange={setRange}
          activeLabel={data?.label}
        />
      </div>

      {isLoading ? (
        <p className="mt-8 text-lagari-muted">Loading…</p>
      ) : error ? (
        <p className="mt-8 text-lagari-danger">
          {error instanceof Error ? error.message : "Could not load analytics."}
        </p>
      ) : !data ? (
        <p className="mt-8 text-lagari-muted">No analytics data.</p>
      ) : (
        <>
          {isFetching && !isLoading ? (
            <p className="mt-4 text-xs text-lagari-muted">Updating…</p>
          ) : null}

          {data.dataQualityWarnings.length > 0 ? (
            <ul className="mt-4 space-y-1 text-xs text-amber-400/90">
              {data.dataQualityWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}

          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Unique visitors" value={String(data.uniqueVisitors)} />
            <Card label="New visitors" value={String(data.newVisitors)} />
            <Card
              label="Returning visitors"
              value={String(data.returningVisitors)}
            />
            <Card
              label="Active sessions (30m)"
              value={String(data.activeSessions)}
            />
            <Card
              label="Checkout conversion"
              value={`${data.checkoutConversionRate}%`}
              hint="Checkout starts that placed an order"
            />
            <Card
              label="Checkout drop-off"
              value={`${data.cartDropOffRate}%`}
              hint="Checkout starts that did not place an order"
            />
            <Card
              label="View → cart"
              value={`${data.viewToCartRate}%`}
              hint="Product viewers who also added to cart"
            />
            <Card
              label="Overall conversion"
              value={`${data.overallConversionRate}%`}
              hint="Visitors who placed an order"
            />
          </dl>

          <section className="admin-card mt-8 px-4 py-5">
            <h2 className="font-display text-lg font-semibold">Funnel</h2>
            <p className="mt-1 text-xs text-lagari-muted">
              Step counts are distinct sessions. Nested rates use sessions that
              completed the prior step.
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <FunnelStep label="Product views" value={data.productViewSessions} />
              <FunnelStep
                label="Add to cart (all)"
                value={data.addToCartSessions}
              />
              <FunnelStep
                label="Add to cart (after view)"
                value={data.viewThenCartSessions}
                sub={`${data.viewToCartRate}% of views`}
              />
              <FunnelStep
                label="Checkout started"
                value={data.checkoutStarts}
                sub={`${data.cartToCheckoutRate}% of cart sessions`}
              />
              <FunnelStep
                label="Orders placed (events)"
                value={data.orderPlacedSessions}
              />
              <FunnelStep label="Orders (DB)" value={data.ordersPlacedInRange} />
            </dl>
            <div className="mt-6 border-t border-lagari-border pt-5">
              <h3 className="font-display text-base font-semibold">
                Checkout outcomes
              </h3>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <FunnelStep
                  label="Cart abandonment"
                  value={`${data.cartAbandonmentRate}%`}
                  sub="Add-to-cart sessions that never started checkout"
                />
                <FunnelStep
                  label="Cart → checkout"
                  value={`${data.cartToCheckoutRate}%`}
                  sub="Add-to-cart sessions that started checkout"
                />
                <FunnelStep
                  label="Cancelled orders"
                  value={data.cancelledOrders}
                  sub="Orders cancelled in selected range"
                />
              </dl>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Top products</h2>
            <p className="mt-1 text-xs text-lagari-muted">
              Unique viewers = distinct visitors per product in range. Total views
              = all counted product_view events after deduplication.
            </p>
            {data.topProducts.length === 0 ? (
              <p className="mt-4 text-lagari-muted">
                No product activity in range yet.
              </p>
            ) : (
              <>
                <div className="hidden lg:block admin-card mt-4 overflow-x-auto">
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
                          <td className="px-4 py-3 text-right">
                            {row.uniqueViewers}
                          </td>
                          <td className="px-4 py-3 text-right">{row.totalViews}</td>
                          <td className="px-4 py-3 text-right">
                            {row.addToCartSessions}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <AdminRowActionsMenu
                              menuLabel={`Actions for ${row.productTitle}`}
                              actions={[
                                ...(row.productId
                                  ? [
                                      {
                                        label: "Edit",
                                        href: `/admin-panel-route/products/${row.productId}/edit`,
                                      },
                                    ]
                                  : []),
                                {
                                  label: "View storefront",
                                  href: `/product/${row.productSlug}`,
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="mt-4 space-y-3 lg:hidden">
                  {data.topProducts.map((row) => (
                    <AdminListCard key={row.productSlug}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
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
                        </div>
                        <AdminRowActionsMenu
                          menuLabel={`Actions for ${row.productTitle}`}
                          actions={[
                            ...(row.productId
                              ? [
                                  {
                                    label: "Edit",
                                    href: `/admin-panel-route/products/${row.productId}/edit`,
                                  },
                                ]
                              : []),
                            {
                              label: "View storefront",
                              href: `/product/${row.productSlug}`,
                            },
                          ]}
                        />
                      </div>
                      <AdminListCardFields>
                        <AdminListCardField
                          label="Unique viewers"
                          value={row.uniqueViewers}
                        />
                        <AdminListCardField label="Total views" value={row.totalViews} />
                        <AdminListCardField
                          label="Add to cart"
                          value={row.addToCartSessions}
                        />
                      </AdminListCardFields>
                    </AdminListCard>
                  ))}
                </ul>
              </>
            )}
          </section>

          {data.topSearches.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold">Top searches</h2>
              <div className="hidden lg:block admin-card mt-4 overflow-x-auto">
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
                        <td className="px-4 py-3 text-right">
                          {row.uniqueSessions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 space-y-2 lg:hidden">
                {data.topSearches.map((row) => (
                  <AdminListCard key={row.query} className="!p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{row.query}</span>
                      <span className="tabular-nums text-lagari-muted">
                        {row.uniqueSessions} sessions
                      </span>
                    </div>
                  </AdminListCard>
                ))}
              </ul>
            </section>
          ) : null}

          {data.categoryInterest.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold">
                Category interest
              </h2>
              <div className="hidden lg:block admin-card mt-4 overflow-x-auto">
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
                        <td className="px-4 py-3 text-right">
                          {row.uniqueSessions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 space-y-2 lg:hidden">
                {data.categoryInterest.map((row) => (
                  <AdminListCard key={row.category} className="!p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{row.category}</span>
                      <span className="tabular-nums text-lagari-muted">
                        {row.uniqueSessions} sessions
                      </span>
                    </div>
                  </AdminListCard>
                ))}
              </ul>
            </section>
          ) : null}

          {data.reviewMetrics ? (
            <section className="mt-12">
              <h2 className="font-display text-xl font-semibold">Reviews</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card
                  label="Pending moderation"
                  value={String(data.reviewMetrics.pendingCount)}
                />
                <Card
                  label="Submitted in range"
                  value={String(data.reviewMetrics.submittedInRange)}
                />
                <Card
                  label="Site average rating"
                  value={
                    data.reviewMetrics.averageRatingSiteWide > 0
                      ? `${data.reviewMetrics.averageRatingSiteWide.toFixed(1)} ★`
                      : "—"
                  }
                />
                <Card
                  label="Verified purchases"
                  value={`${data.reviewMetrics.verifiedShare}%`}
                />
              </dl>

              {data.reviewMetrics.topRatedProducts.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-lg font-semibold">Top rated products</h3>
                  <ul className="mt-3 space-y-2">
                    {data.reviewMetrics.topRatedProducts.map((row) => (
                      <li
                        key={row.productId}
                        className="admin-card flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                      >
                        <div>
                          <Link
                            href={`/product/${row.productSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-lagari-primary hover:text-lagari-brass"
                          >
                            {row.productTitle}
                          </Link>
                          <p className="text-xs text-lagari-muted">
                            {row.averageRating.toFixed(1)} ★ · {row.reviewCount} reviews
                          </p>
                        </div>
                        <Link
                          href={`/admin-panel-route/products/${row.productId}/edit`}
                          className="text-xs text-lagari-brass hover:underline"
                        >
                          Edit
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.reviewMetrics.mostReviewedProducts.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-lg font-semibold">Most reviewed</h3>
                  <ul className="mt-3 space-y-2">
                    {data.reviewMetrics.mostReviewedProducts.map((row) => (
                      <li
                        key={`most-${row.productId}`}
                        className="admin-card flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                      >
                        <div>
                          <Link
                            href={`/product/${row.productSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-lagari-primary hover:text-lagari-brass"
                          >
                            {row.productTitle}
                          </Link>
                          <p className="text-xs text-lagari-muted">
                            {row.reviewCount} reviews · {row.averageRating.toFixed(1)} ★
                          </p>
                        </div>
                        <Link
                          href={`/admin-panel-route/products/${row.productId}/edit`}
                          className="text-xs text-lagari-brass hover:underline"
                        >
                          Edit
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="admin-card px-4 py-5">
      <dt className="font-label text-lagari-brass-dim">{label}</dt>
      <dd className="font-display mt-2 text-2xl font-semibold">{value}</dd>
      {hint ? <p className="mt-1 text-xs text-lagari-muted">{hint}</p> : null}
    </div>
  );
}

function FunnelStep({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div>
      <dt className="font-label text-lagari-brass-dim">{label}</dt>
      <dd className="font-display mt-1 text-xl font-semibold">{value}</dd>
      {sub ? <p className="mt-0.5 text-xs text-lagari-muted">{sub}</p> : null}
    </div>
  );
}
