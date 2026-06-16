import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
import {
  Customer,
  Order,
  OrderItem,
  Product,
  ProductReview,
  ProductVariant,
} from "../db/models";
import { AppError } from "../middleware/errorHandler";
import { ilikeContainsPattern, normalizeSearchTerm } from "../utils/search-text";
import {
  ContactValidationError,
  normalizeContact,
} from "../utils/contact-normalize";
import { notifyReviewSubmitted } from "./notification.service";

const VERIFIED_ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered"];

export type ReviewSummary = {
  averageRating: number;
  totalCount: number;
  distribution: Record<string, number>;
};

export type AdminReviewListParams = {
  /** `all` — every review; `pending` — unpublished queue; `published` — legacy published-only filter. */
  status: "all" | "pending" | "published";
  /** Matches product slug or title (partial, case-insensitive). */
  productSearch?: string;
  /** @deprecated Use productSearch — kept for older admin links. */
  productSlug?: string;
  from?: Date;
  to?: Date;
  sort?: "newest" | "oldest" | "rating_high" | "rating_low";
  ratingMin?: number;
  ratingMax?: number;
  page?: number;
  limit?: number;
};

export type AdminReviewRow = {
  id: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  /** FK to customers — null for Shopify-imported reviews */
  customerId: string | null;
  authorName: string;
  rating: number;
  body: string;
  source: string;
  isPublished: boolean;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  /** Normalised contact used at submission — for admin traceability only */
  contactPhoneNormalized: string | null;
  contactEmailNormalized: string | null;
};

export type LinkedOrderItem = {
  id: string;
  productTitleSnapshot: string;
  variantNameSnapshot: string;
  quantity: number;
  unitPricePkr: number;
  lineTotalPkr: number;
};

export type LinkedOrderSummary = {
  orderId: string;
  orderNumber: number;
  status: string;
  createdAt: Date;
  totalPkr: number;
  subtotalPkr: number;
  discountPkr: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingCity: string;
  shippingAddress: string;
  items: LinkedOrderItem[];
};

function emptyDistribution(): Record<string, number> {
  return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
}

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

function mapAdminReviewRow(r: ProductReview): AdminReviewRow {
  const product = (r as ProductReview & { product?: Product }).product;
  return {
    id: r.id,
    productId: r.productId,
    productSlug: product?.slug ?? "",
    productTitle: product?.title ?? "",
    customerId: r.customerId ?? null,
    authorName: r.authorName,
    rating: r.rating,
    body: r.body,
    source: r.source,
    isPublished: r.isPublished,
    isVerifiedPurchase: r.isVerifiedPurchase,
    createdAt: r.createdAt,
    contactPhoneNormalized: r.contactPhoneNormalized ?? null,
    contactEmailNormalized: r.contactEmailNormalized ?? null,
  };
}

export async function getProductReviewSummary(
  productId: string,
): Promise<ReviewSummary | null> {
  const statsRows = await sequelize.query<{ count: number; avg: number | null }>(
    `SELECT COUNT(*)::int AS count,
            ROUND(AVG(rating)::numeric, 1)::float AS avg
     FROM product_reviews
     WHERE product_id = :productId AND is_published = true`,
    { replacements: { productId }, type: QueryTypes.SELECT },
  );

  const stats = statsRows[0];
  if (!stats?.count) return null;

  const distRows = await sequelize.query<{ rating: number; count: number }>(
    `SELECT rating, COUNT(*)::int AS count
     FROM product_reviews
     WHERE product_id = :productId AND is_published = true
     GROUP BY rating`,
    { replacements: { productId }, type: QueryTypes.SELECT },
  );

  const distribution = emptyDistribution();
  for (const row of distRows) {
    const key = String(Math.min(5, Math.max(1, row.rating)));
    distribution[key] = row.count;
  }

  return {
    averageRating: stats.avg ?? 0,
    totalCount: stats.count,
    distribution,
  };
}

export async function getReviewSummariesForProducts(
  productIds: string[],
): Promise<Map<string, ReviewSummary>> {
  const map = new Map<string, ReviewSummary>();
  if (!productIds.length) return map;

  const statsRows = await sequelize.query<{
    product_id: string;
    count: number;
    avg: number | null;
  }>(
    `SELECT product_id,
            COUNT(*)::int AS count,
            ROUND(AVG(rating)::numeric, 1)::float AS avg
     FROM product_reviews
     WHERE product_id IN (:productIds) AND is_published = true
     GROUP BY product_id`,
    { replacements: { productIds }, type: QueryTypes.SELECT },
  );

  for (const row of statsRows) {
    map.set(row.product_id, {
      averageRating: row.avg ?? 0,
      totalCount: row.count,
      distribution: emptyDistribution(),
    });
  }

  return map;
}

export async function countPendingReviews(): Promise<number> {
  const rows = await sequelize.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM product_reviews WHERE is_published = false`,
    { type: QueryTypes.SELECT },
  );
  return rows[0]?.count ?? 0;
}

async function findProductBySlug(productSlug: string) {
  const product = await Product.findOne({
    where: { slug: productSlug, isPublished: true, deletedAt: null },
  });
  if (!product) throw new AppError(404, "Product not found");
  return product;
}

// ---------------------------------------------------------------------------
// Customer resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a Customer from normalised contact details.
 *
 * Priority:  phone (unique in DB) → then email (non-unique: reject if ambiguous)
 * Returns null when no customer is found.
 * Throws 422 AppError when email matches multiple accounts.
 */
async function resolveCustomerFromContact(
  phone: string | null,
  email: string | null,
): Promise<Customer | null> {
  if (phone) {
    return Customer.findOne({ where: { phone } });
  }

  if (email) {
    const matches = await Customer.findAll({ where: { email } });
    if (matches.length > 1) {
      throw new AppError(
        422,
        "Multiple accounts share that email. Please use the phone number from your order instead.",
      );
    }
    return matches[0] ?? null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Purchase counting
// ---------------------------------------------------------------------------

/**
 * Total quantity of units of a given product bought by a customer
 * across all qualifying orders (not cancelled/archived).
 */
async function countPurchasedUnits(
  customerId: string,
  productId: string,
): Promise<number> {
  const variants = await ProductVariant.findAll({
    where: { productId },
    attributes: ["id"],
  });
  const variantIds = variants.map((v) => v.id);
  if (!variantIds.length) return 0;

  const rows = await sequelize.query<{ total: number }>(
    `SELECT COALESCE(SUM(oi.quantity), 0)::int AS total
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.customer_id    = :customerId
       AND oi.variant_id    IN (:variantIds)
       AND o.status         IN (:statuses)
       AND o.archived_at    IS NULL`,
    {
      replacements: {
        customerId,
        variantIds,
        statuses: VERIFIED_ORDER_STATUSES,
      },
      type: QueryTypes.SELECT,
    },
  );

  return rows[0]?.total ?? 0;
}

/** Number of customer-submitted reviews this customer has already left for a product. */
async function countExistingCustomerReviews(
  customerId: string,
  productId: string,
): Promise<number> {
  return ProductReview.count({
    where: { customerId, productId, source: "customer" },
  });
}

// ---------------------------------------------------------------------------
// Eligibility check (also called by the eligibility endpoint)
// ---------------------------------------------------------------------------

export type ReviewEligibilityResult =
  | { canSubmit: true; purchaseUnits: number; remainingReviews: number }
  | {
      canSubmit: false;
      reason:
        | "contact_required"
        | "contact_invalid"
        | "not_found"
        | "no_purchase"
        | "limit_reached"
        | "ambiguous_email";
      message: string;
    };

/**
 * Validate whether a customer identified by contact can submit a review
 * for the given product, including purchase-count quota enforcement.
 *
 * Returns a result object — never throws (caller decides how to surface errors).
 */
export async function checkReviewEligibility(
  productId: string,
  contact: { phone?: string | null; email?: string | null },
): Promise<ReviewEligibilityResult> {
  // 1. Normalise / validate contact
  let normalised: { phone: string | null; email: string | null };
  try {
    normalised = normalizeContact(contact);
  } catch (err) {
    if (err instanceof ContactValidationError) {
      return {
        canSubmit: false,
        reason: "contact_invalid",
        message: err.message,
      };
    }
    throw err;
  }

  // 2. Resolve customer
  let customer: Customer | null;
  try {
    customer = await resolveCustomerFromContact(normalised.phone, normalised.email);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 422) {
      return {
        canSubmit: false,
        reason: "ambiguous_email",
        message: err.message,
      };
    }
    throw err;
  }

  if (!customer) {
    return {
      canSubmit: false,
      reason: "not_found",
      message:
        "We couldn't find an account with those contact details. Please use the phone number or email from your order.",
    };
  }

  // 3. Count purchases
  const purchaseUnits = await countPurchasedUnits(customer.id, productId);
  if (purchaseUnits === 0) {
    return {
      canSubmit: false,
      reason: "no_purchase",
      message:
        "We couldn't verify a purchase for this product with those contact details. Please use the contact information from your order.",
    };
  }

  // 4. Count existing reviews
  const existingReviews = await countExistingCustomerReviews(customer.id, productId);
  const remaining = purchaseUnits - existingReviews;

  if (remaining <= 0) {
    return {
      canSubmit: false,
      reason: "limit_reached",
      message: `You've already reviewed this product for each purchase on your account (${existingReviews} of ${purchaseUnits}).`,
    };
  }

  return { canSubmit: true, purchaseUnits, remainingReviews: remaining };
}

export async function listPublishedReviews(productSlug: string) {
  const product = await findProductBySlug(productSlug);

  const [rows, summary] = await Promise.all([
    ProductReview.findAll({
      where: { productId: product.id, isPublished: true },
      order: [["createdAt", "DESC"]],
      limit: 50,
    }),
    getProductReviewSummary(product.id),
  ]);

  return {
    reviews: rows.map(mapReviewRow),
    summary: summary ?? {
      averageRating: 0,
      totalCount: 0,
      distribution: emptyDistribution(),
    },
  };
}

export async function submitCustomerReview(
  productSlug: string,
  input: {
    authorName: string;
    rating: number;
    body: string;
    contactPhone?: string | null;
    contactEmail?: string | null;
  },
  sessionId?: string,
) {
  const product = await findProductBySlug(productSlug);

  // --- Eligibility check (throws descriptive AppError on failure) ---
  const eligibility = await checkReviewEligibility(product.id, {
    phone: input.contactPhone,
    email: input.contactEmail,
  });

  if (!eligibility.canSubmit) {
    const statusCode =
      eligibility.reason === "limit_reached" ? 409 : 422;
    throw new AppError(statusCode, eligibility.message);
  }

  // Resolve customer once more (already validated above, so safe)
  const normalised = normalizeContact({
    phone: input.contactPhone,
    email: input.contactEmail,
  });
  const customer = await resolveCustomerFromContact(normalised.phone, normalised.email);

  const review = await ProductReview.create({
    productId: product.id,
    customerId: customer!.id,
    authorName: input.authorName.trim(),
    rating: input.rating,
    body: input.body.trim(),
    source: "customer",
    isPublished: true,
    isVerifiedPurchase: true,
    sessionId: sessionId ?? null,
    contactPhoneNormalized: normalised.phone,
    contactEmailNormalized: normalised.email,
  });

  void notifyReviewSubmitted({
    reviewId: review.id,
    productTitle: product.title,
    authorName: review.authorName,
    rating: review.rating,
    isPublished: true,
  }).catch((err) => console.error("review notification failed:", err));

  const remaining = eligibility.remainingReviews - 1;
  return {
    id: review.id,
    isPublished: true,
    isVerifiedPurchase: true,
    message:
      remaining > 0
        ? `Thank you — your verified review is now live. You can submit ${remaining} more review${remaining === 1 ? "" : "s"} for this product.`
        : "Thank you — your verified review is now live.",
  };
}

function resolveAdminReviewOrder(
  sort: AdminReviewListParams["sort"],
): Array<[string, string]> {
  switch (sort) {
    case "oldest":
      return [["createdAt", "ASC"]];
    case "rating_high":
      return [
        ["rating", "DESC"],
        ["createdAt", "DESC"],
      ];
    case "rating_low":
      return [
        ["rating", "ASC"],
        ["createdAt", "DESC"],
      ];
    case "newest":
    default:
      return [["createdAt", "DESC"]];
  }
}

export async function listAdminReviews(params: AdminReviewListParams) {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.status === "pending") {
    where.isPublished = false;
  } else if (params.status === "published") {
    where.isPublished = true;
  }

  if (params.ratingMin != null || params.ratingMax != null) {
    const ratingClause: Record<symbol, number> = {};
    if (params.ratingMin != null) ratingClause[Op.gte] = params.ratingMin;
    if (params.ratingMax != null) ratingClause[Op.lte] = params.ratingMax;
    where.rating = ratingClause;
  }
  if (params.from || params.to) {
    const createdAt: Record<string, Date> = {};
    if (params.from) createdAt[Op.gte as unknown as string] = params.from;
    if (params.to) createdAt[Op.lte as unknown as string] = params.to;
    where.createdAt = createdAt;
  }

  const productInclude: {
    model: typeof Product;
    as: string;
    attributes: string[];
    required?: boolean;
    where?: Record<string, unknown>;
  } = {
    model: Product,
    as: "product",
    attributes: ["id", "slug", "title"],
  };

  const productTerm = normalizeSearchTerm(
    params.productSearch ?? params.productSlug ?? "",
  );
  if (productTerm) {
    const pattern = ilikeContainsPattern(productTerm);
    productInclude.where = {
      [Op.or]: [
        { slug: { [Op.iLike]: pattern } },
        { title: { [Op.iLike]: pattern } },
      ],
    };
    productInclude.required = true;
  }

  const { rows, count } = await ProductReview.findAndCountAll({
    where,
    include: [productInclude],
    order: resolveAdminReviewOrder(params.sort),
    limit,
    offset,
    distinct: true,
  });

  return {
    reviews: rows.map(mapAdminReviewRow),
    total: count,
    page,
    limit,
  };
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

export type ReviewAnalyticsProductRow = {
  productId: string;
  productSlug: string;
  productTitle: string;
  averageRating: number;
  reviewCount: number;
};

export type ReviewAnalytics = {
  pendingCount: number;
  publishedCount: number;
  submittedInRange: number;
  averageRatingSiteWide: number;
  verifiedShare: number;
  ratingDistribution: Record<string, number>;
  topRatedProducts: ReviewAnalyticsProductRow[];
  mostReviewedProducts: ReviewAnalyticsProductRow[];
};

export async function getReviewAnalytics(from: Date, to: Date): Promise<ReviewAnalytics> {
  const countRows = await sequelize.query<{
    pending: number;
    published: number;
    submitted: number;
  }>(
    `SELECT
       (SELECT COUNT(*)::int FROM product_reviews WHERE is_published = false) AS pending,
       (SELECT COUNT(*)::int FROM product_reviews WHERE is_published = true) AS published,
       (SELECT COUNT(*)::int FROM product_reviews WHERE created_at >= :from AND created_at <= :to) AS submitted`,
    { replacements: { from, to }, type: QueryTypes.SELECT },
  );
  const counts = countRows[0];
  const pendingCount = counts?.pending ?? 0;
  const publishedCount = counts?.published ?? 0;
  const submittedInRange = counts?.submitted ?? 0;

  const siteAvgRows = await sequelize.query<{ avg: number | null }>(
    `SELECT ROUND(AVG(rating)::numeric, 1)::float AS avg
     FROM product_reviews WHERE is_published = true`,
    { type: QueryTypes.SELECT },
  );

  const verifiedRows = await sequelize.query<{ verified: number; total: number }>(
    `SELECT
       SUM(CASE WHEN is_verified_purchase THEN 1 ELSE 0 END)::int AS verified,
       COUNT(*)::int AS total
     FROM product_reviews WHERE is_published = true`,
    { type: QueryTypes.SELECT },
  );
  const verified = verifiedRows[0];
  const verifiedShare =
    verified?.total && verified.total > 0
      ? Math.round((verified.verified / verified.total) * 1000) / 10
      : 0;

  const distRows = await sequelize.query<{ rating: number; count: number }>(
    `SELECT rating, COUNT(*)::int AS count
     FROM product_reviews WHERE is_published = true GROUP BY rating`,
    { type: QueryTypes.SELECT },
  );
  const ratingDistribution = emptyDistribution();
  for (const row of distRows) {
    ratingDistribution[String(row.rating)] = row.count;
  }

  const topRated = await sequelize.query<{
    product_id: string;
    slug: string;
    title: string;
    avg: number;
    count: number;
  }>(
    `SELECT p.id AS product_id, p.slug, p.title,
            ROUND(AVG(r.rating)::numeric, 1)::float AS avg,
            COUNT(*)::int AS count
     FROM product_reviews r
     JOIN products p ON p.id = r.product_id
     WHERE r.is_published = true
     GROUP BY p.id, p.slug, p.title
     HAVING COUNT(*) >= 3
     ORDER BY avg DESC, count DESC
     LIMIT 10`,
    { type: QueryTypes.SELECT },
  );

  const mostReviewed = await sequelize.query<{
    product_id: string;
    slug: string;
    title: string;
    avg: number;
    count: number;
  }>(
    `SELECT p.id AS product_id, p.slug, p.title,
            ROUND(AVG(r.rating)::numeric, 1)::float AS avg,
            COUNT(*)::int AS count
     FROM product_reviews r
     JOIN products p ON p.id = r.product_id
     WHERE r.is_published = true
     GROUP BY p.id, p.slug, p.title
     ORDER BY count DESC, avg DESC
     LIMIT 10`,
    { type: QueryTypes.SELECT },
  );

  const mapProductRow = (row: (typeof topRated)[0]): ReviewAnalyticsProductRow => ({
    productId: row.product_id,
    productSlug: row.slug,
    productTitle: row.title,
    averageRating: row.avg,
    reviewCount: row.count,
  });

  return {
    pendingCount,
    publishedCount,
    submittedInRange,
    averageRatingSiteWide: siteAvgRows[0]?.avg ?? 0,
    verifiedShare,
    ratingDistribution,
    topRatedProducts: topRated.map(mapProductRow),
    mostReviewedProducts: mostReviewed.map(mapProductRow),
  };
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

/**
 * Find the most recent qualifying order by the review author for this product.
 * Used by the admin panel to surface the purchase that backs a verified review.
 */
export async function getLinkedOrderForReview(
  reviewId: string,
): Promise<LinkedOrderSummary | null> {
  const review = await ProductReview.findByPk(reviewId);
  if (!review || !review.customerId || !review.isVerifiedPurchase) return null;

  const variants = await ProductVariant.findAll({
    where: { productId: review.productId },
    attributes: ["id"],
  });
  const variantIds = variants.map((v) => v.id);
  if (!variantIds.length) return null;

  // Most recent order by this customer containing this product
  const rows = await sequelize.query<{
    order_id: string;
    order_number: number;
    status: string;
    created_at: Date;
    total_pkr: number;
    subtotal_pkr: number;
    discount_pkr: number;
    shipping_city: string;
    shipping_address: string;
    customer_full_name: string | null;
    customer_phone: string;
    customer_email: string | null;
  }>(
    `SELECT o.id          AS order_id,
            o.order_number,
            o.status,
            o.created_at,
            o.total_pkr,
            o.subtotal_pkr,
            o.discount_pkr,
            o.shipping_city,
            o.shipping_address,
            c.full_name   AS customer_full_name,
            c.phone       AS customer_phone,
            c.email       AS customer_email
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE o.customer_id = :customerId
       AND o.status IN (:statuses)
       AND o.archived_at IS NULL
       AND EXISTS (
         SELECT 1 FROM order_items oi
         WHERE oi.order_id = o.id
           AND oi.variant_id IN (:variantIds)
       )
     ORDER BY o.created_at DESC
     LIMIT 1`,
    {
      replacements: {
        customerId: review.customerId,
        statuses: VERIFIED_ORDER_STATUSES,
        variantIds,
      },
      type: QueryTypes.SELECT,
    },
  );

  const order = rows[0];
  if (!order) return null;

  const itemRows = await sequelize.query<{
    id: string;
    product_title_snapshot: string;
    variant_name_snapshot: string;
    quantity: number;
    unit_price_pkr: number;
    line_total_pkr: number;
  }>(
    `SELECT oi.id,
            oi.product_title_snapshot,
            oi.variant_name_snapshot,
            oi.quantity,
            oi.unit_price_pkr,
            oi.line_total_pkr
     FROM order_items oi
     WHERE oi.order_id = :orderId
     ORDER BY oi.created_at ASC`,
    { replacements: { orderId: order.order_id }, type: QueryTypes.SELECT },
  );

  return {
    orderId: order.order_id,
    orderNumber: order.order_number,
    status: order.status,
    createdAt: order.created_at,
    totalPkr: order.total_pkr,
    subtotalPkr: order.subtotal_pkr,
    discountPkr: order.discount_pkr,
    customerName: order.customer_full_name ?? "—",
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    shippingCity: order.shipping_city,
    shippingAddress: order.shipping_address,
    items: itemRows.map((i) => ({
      id: i.id,
      productTitleSnapshot: i.product_title_snapshot,
      variantNameSnapshot: i.variant_name_snapshot,
      quantity: i.quantity,
      unitPricePkr: i.unit_price_pkr,
      lineTotalPkr: i.line_total_pkr,
    })),
  };
}
