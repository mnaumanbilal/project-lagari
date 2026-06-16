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

/**
 * Check whether the caller is eligible to submit a review.
 * Called after the user types their contact — debounced in the UI.
 */
export async function fetchReviewEligibility(
  slug: string,
  contact: { contactPhone?: string; contactEmail?: string },
): Promise<ReviewEligibilityResult> {
  const params = new URLSearchParams();
  if (contact.contactPhone) params.set("contactPhone", contact.contactPhone);
  if (contact.contactEmail) params.set("contactEmail", contact.contactEmail);

  return apiFetch<ReviewEligibilityResult>(
    `/catalog/products/${slug}/reviews/eligibility?${params.toString()}`,
    { cache: "no-store" },
  );
}

export async function submitProductReview(
  slug: string,
  body: {
    authorName: string;
    rating: number;
    body: string;
    contactPhone?: string;
    contactEmail?: string;
  },
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
