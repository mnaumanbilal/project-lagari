import { Op } from "sequelize";
import {
  Order,
  OrderItem,
  Product,
  ProductReview,
  ProductVariant,
} from "../db/models";
import { AppError } from "../middleware/errorHandler";
import { notifyReviewSubmitted } from "./notification.service";

const VERIFIED_ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered"];

function mapReviewRow(r: ProductReview) {
  return {
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    body: r.body,
    source: r.source,
    isVerifiedPurchase: r.isVerifiedPurchase,
    createdAt: r.createdAt,
  };
}

function buildSummary(rows: ProductReview[]) {
  const distribution: Record<string, number> = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };
  for (const row of rows) {
    const key = String(Math.min(5, Math.max(1, row.rating)));
    distribution[key] = (distribution[key] ?? 0) + 1;
  }
  const totalCount = rows.length;
  const averageRating =
    totalCount > 0
      ? Math.round(
          (rows.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10,
        ) / 10
      : 0;

  return { averageRating, totalCount, distribution };
}

async function findProductBySlug(productSlug: string) {
  const product = await Product.findOne({
    where: { slug: productSlug, isPublished: true, deletedAt: null },
  });
  if (!product) throw new AppError(404, "Product not found");
  return product;
}

async function hasVerifiedPurchase(
  sessionId: string | undefined,
  productId: string,
): Promise<boolean> {
  if (!sessionId) return false;

  const variants = await ProductVariant.findAll({
    where: { productId, isActive: true },
    attributes: ["id"],
  });
  const variantIds = variants.map((v) => v.id);
  if (!variantIds.length) return false;

  const order = await Order.findOne({
    where: {
      sessionId,
      status: { [Op.in]: VERIFIED_ORDER_STATUSES },
    },
    include: [
      {
        model: OrderItem,
        as: "items",
        where: { variantId: { [Op.in]: variantIds } },
        required: true,
        attributes: ["id"],
      },
    ],
  });

  return Boolean(order);
}

export async function listPublishedReviews(productSlug: string) {
  const product = await findProductBySlug(productSlug);

  const rows = await ProductReview.findAll({
    where: { productId: product.id, isPublished: true },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });

  return {
    reviews: rows.map(mapReviewRow),
    summary: buildSummary(rows),
  };
}

export async function submitCustomerReview(
  productSlug: string,
  input: { authorName: string; rating: number; body: string },
  sessionId?: string,
) {
  const product = await findProductBySlug(productSlug);

  if (sessionId) {
    const duplicate = await ProductReview.findOne({
      where: { productId: product.id, sessionId },
    });
    if (duplicate) {
      throw new AppError(409, "You already submitted a review for this product.");
    }
  }

  const verified = await hasVerifiedPurchase(sessionId, product.id);

  const review = await ProductReview.create({
    productId: product.id,
    authorName: input.authorName.trim(),
    rating: input.rating,
    body: input.body.trim(),
    source: "customer",
    isPublished: verified,
    isVerifiedPurchase: verified,
    sessionId: sessionId ?? null,
  });

  void notifyReviewSubmitted({
    reviewId: review.id,
    productTitle: product.title,
    authorName: review.authorName,
    rating: review.rating,
    isPublished: verified,
  }).catch((err) => console.error("review notification failed:", err));

  if (verified) {
    return {
      id: review.id,
      isPublished: true,
      isVerifiedPurchase: true,
      message: "Thank you — your verified review is now live.",
    };
  }

  return {
    id: review.id,
    isPublished: false,
    isVerifiedPurchase: false,
    message:
      "Thank you — your review was received and is pending moderation before it appears on the shop.",
  };
}

export async function listAdminReviews(status: "pending" | "published") {
  const where =
    status === "published"
      ? { isPublished: true }
      : { isPublished: false };

  const rows = await ProductReview.findAll({
    where,
    include: [{ model: Product, as: "product", attributes: ["slug", "title"] }],
    order: [["createdAt", "DESC"]],
    limit: 200,
  });

  return rows.map((r) => {
    const product = (r as ProductReview & { product?: Product }).product;
    return {
      id: r.id,
      productSlug: product?.slug ?? "",
      productTitle: product?.title ?? "",
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      source: r.source,
      isPublished: r.isPublished,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt,
    };
  });
}

export async function patchReview(id: string, isPublished: boolean) {
  const review = await ProductReview.findByPk(id);
  if (!review) throw new AppError(404, "Review not found");
  await review.update({ isPublished });
  return review;
}

export async function deleteReview(id: string) {
  const review = await ProductReview.findByPk(id);
  if (!review) throw new AppError(404, "Review not found");
  await review.destroy();
}

export type BulkActionResult = {
  succeeded: number;
  failed: Array<{ id: string; error: string }>;
};

export async function bulkDeleteReviews(ids: string[]): Promise<BulkActionResult> {
  const result: BulkActionResult = { succeeded: 0, failed: [] };
  for (const id of ids) {
    try {
      await deleteReview(id);
      result.succeeded += 1;
    } catch (err) {
      const message =
        err instanceof AppError ? err.message : "Could not delete review";
      result.failed.push({ id, error: message });
    }
  }
  return result;
}

export async function bulkPatchReviews(
  ids: string[],
  isPublished: boolean,
): Promise<BulkActionResult> {
  const result: BulkActionResult = { succeeded: 0, failed: [] };
  for (const id of ids) {
    try {
      await patchReview(id, isPublished);
      result.succeeded += 1;
    } catch (err) {
      const message =
        err instanceof AppError ? err.message : "Could not update review";
      result.failed.push({ id, error: message });
    }
  }
  return result;
}

export type ShopifyReviewRow = {
  productHandle?: string;
  productSlug?: string;
  author: string;
  rating: number;
  body: string;
  date?: string;
  legacyId?: string;
};

export async function importShopifyReviews(
  rows: ShopifyReviewRow[],
  publishByDefault: boolean,
) {
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const slug = (row.productSlug ?? row.productHandle ?? "").trim();
    if (!slug || !row.author || !row.body || row.rating < 1 || row.rating > 5) {
      skipped += 1;
      continue;
    }

    const product = await Product.findOne({ where: { slug, deletedAt: null } });
    if (!product) {
      skipped += 1;
      continue;
    }

    const legacyId =
      row.legacyId ??
      `shopify:${slug}:${row.author}:${row.rating}:${row.body.slice(0, 32)}`;

    const existing = await ProductReview.findOne({
      where: { shopifyLegacyId: legacyId },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await ProductReview.create({
      productId: product.id,
      authorName: row.author.trim(),
      rating: Math.round(row.rating),
      body: row.body.trim(),
      source: "shopify",
      isPublished: publishByDefault,
      isVerifiedPurchase: false,
      sessionId: null,
      shopifyLegacyId: legacyId,
    });
    imported += 1;
  }

  return { imported, skipped };
}
