import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
import { AnalyticsEvent, AnalyticsSession, Order } from "../db/models";

function parseRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export async function ingestEventBatch(
  sessionId: string,
  events: Array<{
    eventName: string;
    payload?: Record<string, unknown> | null;
    clientTs?: string;
  }>,
) {
  const rows = events.map((e) => ({
    sessionId,
    eventName: e.eventName,
    payload: e.payload ?? null,
  }));
  await AnalyticsEvent.bulkCreate(rows);
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

export async function getAnalyticsOverview(days = 7) {
  const { from, to } = parseRange(days);

  const newVisitors = await AnalyticsSession.count({
    where: { startedAt: { [Op.gte]: from, [Op.lte]: to } },
    distinct: true,
    col: "id",
  });

  const activeSessions = await countActiveSessions();

  const cancelledOrders = await Order.count({
    where: {
      status: "cancelled",
      createdAt: { [Op.gte]: from, [Op.lte]: to },
    },
  });

  const dropOffRows = await sequelize.query<{
    checkout_starts: string;
    conversions: string;
  }>(
    `
    WITH starts AS (
      SELECT DISTINCT session_id
      FROM analytics_events
      WHERE event_name = 'checkout_start'
        AND created_at >= :from AND created_at <= :to
    ),
    placed AS (
      SELECT DISTINCT session_id
      FROM analytics_events
      WHERE event_name = 'order_placed'
        AND created_at >= :from AND created_at <= :to
    )
    SELECT
      (SELECT COUNT(*)::text FROM starts) AS checkout_starts,
      (SELECT COUNT(*)::text FROM starts s WHERE EXISTS (
        SELECT 1 FROM placed p WHERE p.session_id = s.session_id
      )) AS conversions;
    `,
    { replacements: { from, to }, type: QueryTypes.SELECT },
  );

  const dropOff = dropOffRows[0];
  const checkoutStarts = Number(dropOff?.checkout_starts ?? 0);
  const conversions = Number(dropOff?.conversions ?? 0);
  const cartDropOffRate =
    checkoutStarts > 0
      ? Math.round(((checkoutStarts - conversions) / checkoutStarts) * 1000) / 10
      : 0;

  const topProducts = await sequelize.query<{
    product_slug: string;
    views: string;
  }>(
    `
    SELECT payload->>'productSlug' AS product_slug, COUNT(*)::text AS views
    FROM analytics_events
    WHERE event_name = 'product_view'
      AND created_at >= :from AND created_at <= :to
      AND payload->>'productSlug' IS NOT NULL
    GROUP BY payload->>'productSlug'
    ORDER BY COUNT(*) DESC
    LIMIT 20;
    `,
    { replacements: { from, to }, type: QueryTypes.SELECT },
  );

  return {
    rangeDays: days,
    from: from.toISOString(),
    to: to.toISOString(),
    newVisitors,
    activeSessions,
    cancelledOrders,
    cartDropOffRate,
    checkoutStarts,
    checkoutConversions: conversions,
    topProductsByViews: topProducts.map((r) => ({
      productSlug: r.product_slug,
      views: Number(r.views),
    })),
  };
}
