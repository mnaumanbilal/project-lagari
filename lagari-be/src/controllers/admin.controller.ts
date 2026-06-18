import type { Request, Response } from "express";
import { Op, QueryTypes } from "sequelize";
import { z } from "zod";
import { Order, Product } from "../db/models";
import * as adminProducts from "../services/admin.product.service";
import * as analytics from "../services/analytics.service";
import * as orderService from "../services/order.service";
import * as reviewService from "../services/review.service";
import { resolveAnalyticsRange } from "../utils/analytics-range";

export async function getMetricsSummary(_req: Request, res: Response) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const activeOrderWhere = { archivedAt: null };

  const [
    ordersToday,
    revenueRows,
    pendingOrders,
    lowStockRows,
    activeSessions,
    pendingReviews,
  ] = await Promise.all([
    Order.count({
      where: { createdAt: { [Op.gte]: startOfDay }, ...activeOrderWhere },
    }),
    Order.sequelize!.query<{ sum: string }>(
      `SELECT COALESCE(SUM(total_pkr), 0)::text AS sum
       FROM orders
       WHERE created_at >= :start AND archived_at IS NULL`,
      { replacements: { start: startOfDay }, type: QueryTypes.SELECT },
    ),
    Order.count({
      where: { status: "pending", ...activeOrderWhere },
    }),
    Product.sequelize!.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM product_variants WHERE is_active = true AND stock <= low_stock_threshold;`,
      { type: QueryTypes.SELECT },
    ),
    analytics.countActiveSessions(),
    reviewService.countPendingReviews(),
  ]);

  const revenueTodayPkr = Number(revenueRows[0]?.sum ?? 0);
  const lowStockCount = lowStockRows[0]?.count ?? 0;

  res.json({
    ordersToday,
    revenueTodayPkr,
    pendingOrders,
    lowStockCount,
    activeSessions,
    pendingReviews,
  });
}

export async function getAnalyticsOverview(req: Request, res: Response) {
  try {
    const range = resolveAnalyticsRange({
      preset: req.query.preset as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      days: req.query.days as string | undefined,
    });
    res.json(await analytics.getAnalyticsOverview(range));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid date range";
    res.status(400).json({ error: message });
  }
}

export async function listAdminProducts(_req: Request, res: Response) {
  res.json(await adminProducts.listAdminProducts());
}

export async function getAdminProduct(req: Request, res: Response) {
  res.json(await adminProducts.getAdminProduct(String(req.params.id)));
}

const productBodySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  designerInspiration: z.string().nullable().optional(),
  scentProfile: z.enum(["light", "dark"]).nullable().optional(),
  topNotes: z.string().nullable().optional(),
  heartNotes: z.string().nullable().optional(),
  baseNotes: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  categorySlugs: z.array(z.string()).optional(),
  noteTagSlugs: z.array(z.string()).optional(),
  variants: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        sku: z.string().min(1),
        name: z.string().min(1),
        pricePkr: z.number().int().nonnegative(),
        compareAtPricePkr: z.number().int().nullable().optional(),
        stock: z.number().int().nonnegative(),
        lowStockThreshold: z.number().int().nonnegative().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .min(1),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        sortOrder: z.number().int().optional(),
        isHero: z.boolean().optional(),
      }),
    )
    .optional(),
});

export async function createAdminProduct(req: Request, res: Response) {
  const body = productBodySchema.parse(req.body);
  const product = await adminProducts.createProduct(body);
  res.status(201).json(product);
}

export async function patchAdminProduct(req: Request, res: Response) {
  const body = productBodySchema.partial().extend({
    variants: productBodySchema.shape.variants.optional(),
  }).parse(req.body);
  const product = await adminProducts.updateProduct(String(req.params.id), body);
  res.json(product);
}

export async function deleteAdminProduct(req: Request, res: Response) {
  await adminProducts.softDeleteProduct(String(req.params.id));
  res.status(204).send();
}

const bulkIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export async function bulkDeleteAdminProducts(req: Request, res: Response) {
  const { ids } = bulkIdsSchema.parse(req.body);
  res.json(await adminProducts.bulkSoftDeleteProducts(ids));
}

const ordersListQuery = z.object({
  status: z
    .enum(["pending", "confirmed", "shipped", "delivered", "rto", "cancelled"])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  archived: z.enum(["true", "false", "all"]).optional(),
});

export async function listAdminOrders(req: Request, res: Response) {
  const query = ordersListQuery.parse(req.query);
  const result = await orderService.listAdminOrders(query);
  res.json(result);
}

export async function getAdminOrder(req: Request, res: Response) {
  res.json(await orderService.getAdminOrderById(String(req.params.id)));
}

const statusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "rto",
    "cancelled",
  ]),
  note: z.string().optional(),
  cancelReason: z.string().optional(),
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),
});

export async function patchOrderStatus(req: Request, res: Response) {
  const body = statusSchema.parse(req.body);
  const detail = await orderService.updateOrderStatus({
    orderId: String(req.params.id),
    toStatus: body.status,
    actorAdminId: req.adminId ?? null,
    note: body.note,
    cancelReason: body.cancelReason,
    courierName: body.courierName,
    trackingNumber: body.trackingNumber,
  });
  res.json(detail);
}

const orderNotesSchema = z.object({
  adminNotes: z.string().nullable(),
});

export async function patchAdminOrder(req: Request, res: Response) {
  const body = orderNotesSchema.parse(req.body);
  const detail = await orderService.updateAdminOrderNotes(
    String(req.params.id),
    body.adminNotes,
  );
  res.json(detail);
}

const archiveSchema = z.object({
  archived: z.boolean(),
});

export async function patchAdminOrderArchive(req: Request, res: Response) {
  const body = archiveSchema.parse(req.body);
  res.json(await orderService.archiveOrder(String(req.params.id), body.archived));
}

export async function bulkArchiveAdminOrders(req: Request, res: Response) {
  const body = bulkIdsSchema.extend({ archived: z.boolean() }).parse(req.body);
  res.json(await orderService.bulkArchiveOrders(body.ids, body.archived));
}

const reviewStatusQuery = z.object({
  status: z.enum(["all", "pending", "published"]).default("all"),
  productSearch: z.string().max(120).optional(),
  productSlug: z.string().max(120).optional(),
  reviewSearch: z.string().max(120).optional(),
  q: z.string().max(120).optional(),
  reviewId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z
    .enum(["newest", "oldest", "rating_high", "rating_low"])
    .optional(),
  ratingMin: z.coerce.number().int().min(1).max(5).optional(),
  ratingMax: z.coerce.number().int().min(1).max(5).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export async function listAdminReviews(req: Request, res: Response) {
  const query = reviewStatusQuery.parse(req.query);
  res.json(
    await reviewService.listAdminReviews({
      status: query.status,
      productSearch: query.productSearch ?? query.productSlug,
      reviewSearch: query.reviewSearch ?? query.q,
      reviewId: query.reviewId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      sort: query.sort,
      ratingMin: query.ratingMin,
      ratingMax: query.ratingMax,
      page: query.page,
      limit: query.limit,
    }),
  );
}

export async function getReviewAnalytics(req: Request, res: Response) {
  try {
    const range = resolveAnalyticsRange(req.query);
    res.json(await reviewService.getReviewAnalytics(range.from, range.to));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid date range";
    res.status(400).json({ error: message });
  }
}

const reviewPatchSchema = z.object({
  isPublished: z.boolean(),
});

export async function patchAdminReview(req: Request, res: Response) {
  const body = reviewPatchSchema.parse(req.body);
  const review = await reviewService.patchReview(String(req.params.id), body.isPublished);
  res.json(review);
}

export async function deleteAdminReview(req: Request, res: Response) {
  await reviewService.deleteReview(String(req.params.id));
  res.status(204).send();
}

export async function getReviewLinkedOrder(req: Request, res: Response) {
  const linked = await reviewService.getLinkedOrderForReview(String(req.params.id));
  if (!linked) {
    res.status(404).json({ error: "No linked order found for this review." });
    return;
  }
  res.json(linked);
}

export async function bulkDeleteAdminReviews(req: Request, res: Response) {
  const { ids } = bulkIdsSchema.parse(req.body);
  res.json(await reviewService.bulkDeleteReviews(ids));
}

export async function bulkPatchAdminReviews(req: Request, res: Response) {
  const body = bulkIdsSchema
    .extend({ isPublished: z.boolean() })
    .parse(req.body);
  res.json(await reviewService.bulkPatchReviews(body.ids, body.isPublished));
}

const importSchema = z.object({
  publishByDefault: z.boolean().optional(),
  reviews: z.array(
    z.object({
      productHandle: z.string().optional(),
      productSlug: z.string().optional(),
      author: z.string(),
      rating: z.number(),
      body: z.string(),
      date: z.string().optional(),
      legacyId: z.string().optional(),
    }),
  ),
});

export async function importShopifyReviews(req: Request, res: Response) {
  const body = importSchema.parse(req.body);
  const result = await reviewService.importShopifyReviews(
    body.reviews,
    body.publishByDefault ?? true,
  );
  res.json(result);
}
