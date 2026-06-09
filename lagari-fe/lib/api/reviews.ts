import { apiFetch } from "./client";

export type ProductReview = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  source: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
};

export type ReviewSummary = {
  averageRating: number;
  totalCount: number;
  distribution: Record<string, number>;
};

export type ProductReviewsResponse = {
  reviews: ProductReview[];
  summary: ReviewSummary;
};

const EMPTY_SUMMARY: ReviewSummary = {
  averageRating: 0,
  totalCount: 0,
  distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
};

export async function fetchProductReviews(
  slug: string,
): Promise<ProductReviewsResponse> {
  return apiFetch<ProductReviewsResponse>(
    `/catalog/products/${slug}/reviews`,
    { cache: "no-store" },
  );
}

export async function submitProductReview(
  slug: string,
  body: { authorName: string; rating: number; body: string },
  sessionId?: string | null,
): Promise<{
  id: string;
  message: string;
  isPublished: boolean;
  isVerifiedPurchase: boolean;
}> {
  return apiFetch(`/catalog/products/${slug}/reviews`, {
    method: "POST",
    sessionId: sessionId ?? undefined,
    body: JSON.stringify(body),
  });
}

export { EMPTY_SUMMARY };
