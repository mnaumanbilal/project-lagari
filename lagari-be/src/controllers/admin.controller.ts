import type { Request, Response } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import { Order, OrderTimelineEvent, Product } from "../db/models";
import { AppError } from "../middleware/errorHandler";
import * as adminProducts from "../services/admin.product.service";
import * as analytics from "../services/analytics.service";
import * as reviewService from "../services/review.service";

export async function getMetricsSummary(_req: Request, res: Response) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const ordersToday = await Order.count({
    where: { createdAt: { [Op.gte]: startOfDay } },
  });

  const todayOrders = await Order.findAll({
    where: { createdAt: { [Op.gte]: startOfDay } },
    attributes: ["totalPkr"],
  });
  const revenueTodayPkr = todayOrders.reduce((s, o) => s + o.totalPkr, 0);
  const pendingOrders = await Order.count({ where: { status: "pending" } });

  const [lowStockRows] = await Product.sequelize!.query(
    `SELECT COUNT(*)::int AS count FROM product_variants WHERE is_active = true AND stock <= low_stock_threshold;`,
  );
  const lowStockCount = (lowStockRows[0] as { count: number })?.count ?? 0;
  const activeSessions = await analytics.countActiveSessions();

  res.json({
    ordersToday,
    revenueTodayPkr,
    pendingOrders,
    lowStockCount,
    activeSessions,
  });
}

export async function getAnalyticsOverview(req: Request, res: Response) {
  const days = Number(req.query.days ?? 7);
  const safeDays = [7, 30].includes(days) ? days : 7;
  res.json(await analytics.getAnalyticsOverview(safeDays));
}

export async function listAdminProducts(_req: Request, res: Response) {
  const products = await Product.findAll({
    where: { deletedAt: null },
    attributes: ["id"],
    order: [["createdAt", "DESC"]],
  });
  const mapped = await Promise.all(
    products.map((p) => adminProducts.getAdminProduct(p.id)),
  );
  res.json(mapped);
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

export async function listAdminOrders(req: Request, res: Response) {
  const status = req.query.status as string | undefined;
  const where = status ? { status } : {};
  const orders = await Order.findAll({
    where,
    include: [{ association: "customer" }],
    order: [["createdAt", "DESC"]],
    limit: 100,
  });
  res.json(
    orders.map((o) => {
      const customer = (o as Order & { customer?: { fullName: string | null; phone: string } }).customer;
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalPkr: o.totalPkr,
        customerName: customer?.fullName ?? "—",
        customerPhone: customer?.phone ?? "—",
        createdAt: o.createdAt,
      };
    }),
  );
}

export async function getAdminOrder(req: Request, res: Response) {
  const orderId = String(req.params.id);
  const order = await Order.findByPk(orderId, {
    include: [
      { association: "customer" },
      { association: "items" },
      { association: "timeline" },
    ],
  });
  if (!order) throw new AppError(404, "Order not found");

  const customer = (order as Order & { customer?: { fullName: string | null; phone: string } }).customer;
  const items = (order as Order & { items?: Array<Record<string, unknown>> }).items ?? [];
  const timeline = (order as Order & { timeline?: OrderTimelineEvent[] }).timeline ?? [];

  res.json({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalPkr: order.totalPkr,
    subtotalPkr: order.subtotalPkr,
    discountPkr: order.discountPkr,
    customerName: customer?.fullName,
    customerPhone: customer?.phone,
    shippingCity: order.shippingCity,
    shippingAddress: order.shippingAddress,
    items,
    timeline: timeline.map((t) => ({
      message: t.message,
      createdAt: t.createdAt,
    })),
    createdAt: order.createdAt,
  });
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
});

const allowedTransitions: Record<string, string[]> = {
  pending: ["confirmed", "rto", "cancelled"],
  confirmed: ["shipped", "rto", "cancelled"],
  shipped: ["delivered", "rto"],
  delivered: [],
  rto: [],
  cancelled: [],
};

export async function patchOrderStatus(req: Request, res: Response) {
  const body = statusSchema.parse(req.body);
  const orderId = String(req.params.id);
  const order = await Order.findByPk(orderId);
  if (!order) throw new AppError(404, "Order not found");

  const allowed = allowedTransitions[order.status] ?? [];
  if (!allowed.includes(body.status)) {
    throw new AppError(400, `Cannot transition from ${order.status} to ${body.status}`);
  }

  const from = order.status;
  await order.update({ status: body.status });

  await OrderTimelineEvent.create({
    orderId: order.id,
    actorAdminId: req.adminId ?? null,
    eventType: "status_changed",
    fromStatus: from,
    toStatus: body.status,
    message: body.note ?? `Status changed to ${body.status}`,
  });

  const detail = await Order.findByPk(order.id, {
    include: [{ association: "customer" }, { association: "items" }, { association: "timeline" }],
  });
  res.json(detail);
}

const reviewStatusQuery = z.object({
  status: z.enum(["pending", "published"]).default("pending"),
});

export async function listAdminReviews(req: Request, res: Response) {
  const { status } = reviewStatusQuery.parse(req.query);
  res.json(await reviewService.listAdminReviews(status));
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
