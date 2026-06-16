import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import * as catalog from "../services/catalog.service";
import * as reviewService from "../services/review.service";
import { AppError } from "../middleware/errorHandler";

// In-memory per-IP rate limit for review submissions (resets every 60s)
const reviewSubmitHits = new Map<string, { count: number; resetAt: number }>();

function reviewRateLimit(ip: string) {
  const now = Date.now();
  const entry = reviewSubmitHits.get(ip);
  if (!entry || now >= entry.resetAt) {
    reviewSubmitHits.set(ip, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (entry.count >= 5) throw new AppError(429, "Too many review submissions. Please try again in a minute.");
  entry.count += 1;
}

export async function listCategories(_req: Request, res: Response) {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(await catalog.listCategories());
}

export async function listNoteTags(_req: Request, res: Response) {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(await catalog.listNoteTags());
}

export async function getSiteConfig(_req: Request, res: Response) {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    cloudinaryCloudName: env.cloudinary.cloudName || null,
  });
}

const listQuery = z.object({
  category: z.string().optional(),
  note: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export async function listProducts(req: Request, res: Response) {
  const query = listQuery.parse(req.query);
  res.setHeader("Cache-Control", "public, max-age=60");
  res.json(await catalog.listProducts(query));
}

export async function getProductBySlug(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const product = await catalog.getProductBySlug(slug);
  if (!product) throw new AppError(404, "Product not found");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.json(product);
}

export async function listProductReviews(req: Request, res: Response) {
  const slug = String(req.params.slug);
  res.json(await reviewService.listPublishedReviews(slug));
}

/**
 * GET /catalog/products/:slug/reviews/eligibility
 * Query params: contactPhone, contactEmail
 *
 * Returns whether the caller can submit a review for this product
 * based on their contact-matched purchase history.
 * Never leaks whether the phone/email exists — returns the same 422
 * for "not found" and "no purchase".
 */
export async function checkReviewEligibility(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const product = await catalog.getProductBySlug(slug);
  if (!product) throw new AppError(404, "Product not found");

  const phone = typeof req.query.contactPhone === "string"
    ? req.query.contactPhone
    : undefined;
  const email = typeof req.query.contactEmail === "string"
    ? req.query.contactEmail
    : undefined;

  const result = await reviewService.checkReviewEligibility(product.id, {
    phone,
    email,
  });

  res.json(result);
}

const reviewBodySchema = z.object({
  authorName: z.string().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(2000),
  /** Phone number the customer used when placing their order */
  contactPhone: z.string().max(30).optional().nullable(),
  /** Email the customer used when placing their order */
  contactEmail: z.string().email().max(255).optional().nullable(),
});

export async function submitProductReview(req: Request, res: Response) {
  reviewRateLimit(req.ip ?? "unknown");
  const slug = String(req.params.slug);
  const body = reviewBodySchema.parse(req.body);
  const sessionId = req.header("x-session-id") ?? undefined;

  res.status(201).json(
    await reviewService.submitCustomerReview(slug, body, sessionId),
  );
}
