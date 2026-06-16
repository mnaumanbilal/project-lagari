import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
import {
  AnalyticsEvent,
  AnalyticsEventFingerprint,
  AnalyticsSession,
  AnalyticsVisitor,
  Order,
} from "../db/models";
import type { AnalyticsRange } from "../utils/analytics-range";
import { getReviewAnalytics } from "./review.service";
import {
  ANALYTICS_EVENT_NAMES,
  computeDedupKey,
  isCountableEvent,
  pktBucketDate,
} from "../utils/analytics-dedup";

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function pctCap(numerator: number, denominator: number): number {
  return Math.min(100, pct(numerator, denominator));
}

export async function ingestEventBatch(
  sessionId: string,
  events: Array<{
    eventName: string;
    payload?: Record<string, unknown> | null;
    clientTs?: string;
  }>,
) {
  const session = await AnalyticsSession.findByPk(sessionId);
  if (!session) return;

  const bucketDate = pktBucketDate();
  const rows: Array<{
    sessionId: string;
    eventName: string;
    payload: Record<string, unknown> | null;
  }> = [];

  for (const e of events) {
    if (!ANALYTICS_EVENT_NAMES.includes(e.eventName as (typeof ANALYTICS_EVENT_NAMES)[number])) {
      continue;
    }

    if (isCountableEvent(e.eventName)) {
      const dedupKey = computeDedupKey(e.eventName, e.payload);
      if (!dedupKey) continue;

      try {
        await AnalyticsEventFingerprint.create({
          sessionId,
          visitorId: session.visitorId,
          eventName: e.eventName,
          dedupKey,
          bucketDate,
        });
      } catch (err: unknown) {
        const name = err && typeof err === "object" && "name" in err ? err.name : "";
        if (name === "SequelizeUniqueConstraintError") continue;
        throw err;
      }
    }

    rows.push({
      sessionId,
      eventName: e.eventName,
      payload: e.payload ?? null,
    });
  }

  if (rows.length > 0) {
    await AnalyticsEvent.bulkCreate(rows);
  }
}

export async function countActiveSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  return AnalyticsSession.count({
    where: {
      endedAt: null,
      lastActivityAt: { [Op.gte]: cutoff },
    },
  });
}

export async function getAnalyticsOverview(range: AnalyticsRange) {
  const { from, to, label, preset } = range;

  const [
    uniqueVisitors,
    newVisitors,
    activeSessions,
    cancelledOrders,
    ordersPlacedInRange,
    funnelRows,
    cartAbandonRows,
    topProducts,
    topSearches,
    categoryInterest,
    reviewAnalytics,
  ] = await Promise.all([
    AnalyticsSession.count({
      where: {
        visitorId: { [Op.ne]: null },
        lastActivityAt: { [Op.gte]: from, [Op.lte]: to },
      },
      distinct: true,
      col: "visitor_id",
    }),
    AnalyticsVisitor.count({
      where: { firstSeenAt: { [Op.gte]: from, [Op.lte]: to } },
    }),
    countActiveSessions(),
    Order.count({
      where: {
        status: "cancelled",
        createdAt: { [Op.gte]: from, [Op.lte]: to },
      },
    }),
    Order.count({
      where: {
        createdAt: { [Op.gte]: from, [Op.lte]: to },
        status: { [Op.ne]: "cancelled" },
      },
    }),
    sequelize.query<{
      product_view_sessions: string;
      add_to_cart_sessions: string;
      view_then_cart_sessions: string;
      checkout_starts: string;
      cart_then_checkout_sessions: string;
      checkout_conversions: string;
      order_placed_sessions: string;
    }>(
      `
    WITH product_views AS (
      SELECT DISTINCT e.session_id
      FROM analytics_events e
      WHERE e.event_name = 'product_view'
        AND e.created_at >= :from AND e.created_at <= :to
    ),
    add_to_cart AS (
      SELECT DISTINCT e.session_id
      FROM analytics_events e
      WHERE e.event_name = 'add_to_cart'
        AND e.created_at >= :from AND e.created_at <= :to
    ),
    checkout_starts AS (
      SELECT DISTINCT e.session_id
      FROM analytics_events e
      WHERE e.event_name = 'checkout_start'
        AND e.created_at >= :from AND e.created_at <= :to
    ),
    orders_placed AS (
      SELECT DISTINCT e.session_id
      FROM analytics_events e
      WHERE e.event_name = 'order_placed'
        AND e.created_at >= :from AND e.created_at <= :to
    ),
    view_then_cart AS (
      SELECT DISTINCT v.session_id
      FROM product_views v
      INNER JOIN add_to_cart a ON a.session_id = v.session_id
    ),
    cart_then_checkout AS (
      SELECT DISTINCT a.session_id
      FROM add_to_cart a
      INNER JOIN checkout_starts c ON c.session_id = a.session_id
    )
    SELECT
      (SELECT COUNT(*)::text FROM product_views) AS product_view_sessions,
      (SELECT COUNT(*)::text FROM add_to_cart) AS add_to_cart_sessions,
      (SELECT COUNT(*)::text FROM view_then_cart) AS view_then_cart_sessions,
      (SELECT COUNT(*)::text FROM checkout_starts) AS checkout_starts,
      (SELECT COUNT(*)::text FROM cart_then_checkout) AS cart_then_checkout_sessions,
      (SELECT COUNT(*)::text FROM checkout_starts s WHERE EXISTS (
        SELECT 1 FROM orders_placed p WHERE p.session_id = s.session_id
      )) AS checkout_conversions,
      (SELECT COUNT(*)::text FROM orders_placed) AS order_placed_sessions;
    `,
      { replacements: { from, to }, type: QueryTypes.SELECT },
    ),
    sequelize.query<{ count: string }>(
      `
    SELECT COUNT(DISTINCT a.session_id)::text AS count
    FROM analytics_events a
    WHERE a.event_name = 'add_to_cart'
      AND a.created_at >= :from AND a.created_at <= :to
      AND NOT EXISTS (
        SELECT 1 FROM analytics_events c
        WHERE c.session_id = a.session_id
          AND c.event_name = 'checkout_start'
          AND c.created_at >= :from AND c.created_at <= :to
      );
    `,
      { replacements: { from, to }, type: QueryTypes.SELECT },
    ),
    sequelize.query<{
      product_slug: string;
      product_id: string | null;
      product_title: string | null;
      unique_viewers: string;
      total_views: string;
      add_to_cart_sessions: string;
    }>(
      `
    WITH views AS (
      SELECT
        e.payload->>'productSlug' AS slug,
        s.visitor_id,
        e.session_id
      FROM analytics_events e
      JOIN analytics_sessions s ON s.id = e.session_id
      WHERE e.event_name = 'product_view'
        AND e.created_at >= :from AND e.created_at <= :to
        AND e.payload->>'productSlug' IS NOT NULL
    ),
    view_agg AS (
      SELECT
        slug,
        COUNT(DISTINCT visitor_id) FILTER (WHERE visitor_id IS NOT NULL) AS unique_viewers,
        COUNT(*) AS total_views
      FROM views
      GROUP BY slug
    ),
    cart_agg AS (
      SELECT
        e.payload->>'productSlug' AS slug,
        COUNT(DISTINCT e.session_id) AS add_to_cart_sessions
      FROM analytics_events e
      WHERE e.event_name = 'add_to_cart'
        AND e.created_at >= :from AND e.created_at <= :to
        AND e.payload->>'productSlug' IS NOT NULL
      GROUP BY e.payload->>'productSlug'
    ),
    combined AS (
      SELECT
        COALESCE(v.slug, c.slug) AS slug,
        COALESCE(v.unique_viewers, 0) AS unique_viewers,
        COALESCE(v.total_views, 0) AS total_views,
        COALESCE(c.add_to_cart_sessions, 0) AS add_to_cart_sessions
      FROM view_agg v
      FULL OUTER JOIN cart_agg c ON c.slug = v.slug
    )
    SELECT
      combined.slug AS product_slug,
      p.id::text AS product_id,
      p.title AS product_title,
      combined.unique_viewers::text,
      combined.total_views::text,
      combined.add_to_cart_sessions::text
    FROM combined
    LEFT JOIN products p ON p.slug = combined.slug AND p.deleted_at IS NULL
    ORDER BY combined.unique_viewers DESC, combined.total_views DESC
    LIMIT 20;
    `,
      { replacements: { from, to }, type: QueryTypes.SELECT },
    ),
    sequelize.query<{
      query: string;
      unique_sessions: string;
    }>(
      `
    SELECT
      e.payload->>'query' AS query,
      COUNT(DISTINCT e.session_id)::text AS unique_sessions
    FROM analytics_events e
    WHERE e.event_name = 'search'
      AND e.created_at >= :from AND e.created_at <= :to
      AND e.payload->>'query' IS NOT NULL
      AND TRIM(e.payload->>'query') <> ''
    GROUP BY e.payload->>'query'
    ORDER BY COUNT(DISTINCT e.session_id) DESC
    LIMIT 15;
    `,
      { replacements: { from, to }, type: QueryTypes.SELECT },
    ),
    sequelize.query<{
      category: string;
      unique_sessions: string;
    }>(
      `
    SELECT
      e.payload->>'category' AS category,
      COUNT(DISTINCT e.session_id)::text AS unique_sessions
    FROM analytics_events e
    WHERE e.event_name = 'category_view'
      AND e.created_at >= :from AND e.created_at <= :to
      AND e.payload->>'category' IS NOT NULL
    GROUP BY e.payload->>'category'
    ORDER BY COUNT(DISTINCT e.session_id) DESC
    LIMIT 15;
    `,
      { replacements: { from, to }, type: QueryTypes.SELECT },
    ),
    getReviewAnalytics(from, to),
  ]);

  const returningVisitors = Math.max(0, uniqueVisitors - newVisitors);
  const funnel = funnelRows[0];
  const productViewSessions = Number(funnel?.product_view_sessions ?? 0);
  const addToCartSessions = Number(funnel?.add_to_cart_sessions ?? 0);
  const viewThenCartSessions = Number(funnel?.view_then_cart_sessions ?? 0);
  const checkoutStarts = Number(funnel?.checkout_starts ?? 0);
  const cartThenCheckoutSessions = Number(funnel?.cart_then_checkout_sessions ?? 0);
  const checkoutConversions = Number(funnel?.checkout_conversions ?? 0);
  const orderPlacedSessions = Number(funnel?.order_placed_sessions ?? 0);
  const cartAbandonSessions = Number(cartAbandonRows[0]?.count ?? 0);

  const cartDropOffRate = pct(checkoutStarts - checkoutConversions, checkoutStarts);
  const checkoutConversionRate = pct(checkoutConversions, checkoutStarts);
  const viewToCartRate = pct(viewThenCartSessions, productViewSessions);
  const cartToCheckoutRate = pct(cartThenCheckoutSessions, addToCartSessions);
  const cartAbandonmentRate = pct(cartAbandonSessions, addToCartSessions);
  const overallConversionRate = pctCap(orderPlacedSessions, uniqueVisitors);

  const dataQualityWarnings: string[] = [];
  if (ordersPlacedInRange > 0 && orderPlacedSessions > 0) {
    const diff = Math.abs(ordersPlacedInRange - orderPlacedSessions);
    const pctDiff = (diff / ordersPlacedInRange) * 100;
    if (pctDiff > 5) {
      dataQualityWarnings.push(
        `Order events (${orderPlacedSessions}) differ from orders table (${ordersPlacedInRange}) by ${Math.round(pctDiff)}%.`,
      );
    }
  }

  return {
    preset: preset ?? null,
    label,
    from: from.toISOString(),
    to: to.toISOString(),
    uniqueVisitors,
    newVisitors,
    returningVisitors,
    activeSessions,
    cancelledOrders,
    ordersPlacedInRange,
    productViewSessions,
    addToCartSessions,
    viewThenCartSessions,
    checkoutStarts,
    cartThenCheckoutSessions,
    checkoutConversions,
    orderPlacedSessions,
    cartDropOffRate,
    checkoutConversionRate,
    viewToCartRate,
    cartToCheckoutRate,
    cartAbandonmentRate,
    overallConversionRate,
    dataQualityWarnings,
    topProducts: topProducts.map((r) => ({
      productSlug: r.product_slug,
      productId: r.product_id,
      productTitle: r.product_title ?? r.product_slug,
      uniqueViewers: Number(r.unique_viewers),
      totalViews: Number(r.total_views),
      addToCartSessions: Number(r.add_to_cart_sessions),
    })),
    topSearches: topSearches.map((r) => ({
      query: r.query,
      uniqueSessions: Number(r.unique_sessions),
    })),
    categoryInterest: categoryInterest.map((r) => ({
      category: r.category,
      uniqueSessions: Number(r.unique_sessions),
    })),
    topProductsByViews: topProducts.map((r) => ({
      productSlug: r.product_slug,
      views: Number(r.total_views),
    })),
    reviewMetrics: {
      pendingCount: reviewAnalytics.pendingCount,
      publishedCount: reviewAnalytics.publishedCount,
      submittedInRange: reviewAnalytics.submittedInRange,
      averageRatingSiteWide: reviewAnalytics.averageRatingSiteWide,
      verifiedShare: reviewAnalytics.verifiedShare,
      ratingDistribution: reviewAnalytics.ratingDistribution,
      topRatedProducts: reviewAnalytics.topRatedProducts,
      mostReviewedProducts: reviewAnalytics.mostReviewedProducts,
    },
  };
}
