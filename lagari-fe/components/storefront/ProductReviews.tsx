"use client";

import { useCallback, useEffect, useState } from "react";
import { StarRating } from "@/components/storefront/StarRating";
import { USE_API } from "@/lib/api/config";
import {
  EMPTY_SUMMARY,
  fetchProductReviews,
  submitProductReview,
  type ProductReview,
  type ReviewSummary,
} from "@/lib/api/reviews";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/session/session-context";

function formatReviewDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-PK", {
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ProductReviews({ slug }: { slug: string }) {
  const { sessionId } = useSession();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(EMPTY_SUMMARY);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!USE_API) return;
    try {
      const data = await fetchProductReviews(slug);
      setReviews(data.reviews);
      setSummary(data.summary);
    } catch {
      setReviews([]);
      setSummary(EMPTY_SUMMARY);
    }
  }, [slug]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!USE_API) return;
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await submitProductReview(
        slug,
        { authorName, rating, body },
        sessionId,
      );
      setMessage(res.message);
      setBody("");
      if (res.isPublished) {
        await loadReviews();
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not submit review. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-16 border-t border-lagari-border pt-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-lagari-primary">
            Reviews
          </h2>
          {summary.totalCount > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StarRating value={Math.round(summary.averageRating)} readonly size="md" />
              <p className="text-sm text-lagari-muted">
                <span className="font-medium text-lagari-primary">
                  {summary.averageRating.toFixed(1)}
                </span>{" "}
                · {summary.totalCount} review
                {summary.totalCount === 1 ? "" : "s"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-lagari-muted">
              No published reviews yet.
            </p>
          )}
        </div>
      </div>

      {summary.totalCount > 0 && (
        <div className="mt-6 max-w-sm space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[String(stars)] ?? 0;
            const pct =
              summary.totalCount > 0
                ? Math.round((count / summary.totalCount) * 100)
                : 0;
            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-lagari-muted">{stars}★</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-lagari-border">
                  <div
                    className="h-full rounded-full bg-lagari-brass transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-lagari-muted">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {reviews.length > 0 ? (
        <ul className="mt-8 space-y-6">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-sm border border-lagari-border bg-lagari-surface/50 p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StarRating value={r.rating} readonly size="sm" />
                <span className="font-medium text-lagari-primary">
                  {r.authorName}
                </span>
                {r.isVerifiedPurchase && (
                  <span className="rounded-sm border border-lagari-brass/30 bg-lagari-brass/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-lagari-brass">
                    Verified purchase
                  </span>
                )}
                {r.source === "shopify" && (
                  <span className="text-[10px] uppercase tracking-wide text-lagari-muted">
                    Imported
                  </span>
                )}
                <span className="text-xs text-lagari-muted">
                  {formatReviewDate(r.createdAt)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-lagari-muted">
                {r.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-lagari-muted">
          Be the first to share your experience with this fragrance.
        </p>
      )}

      {USE_API && (
        <form onSubmit={handleSubmit} className="mt-10 max-w-lg space-y-5">
          <div>
            <h3 className="font-label text-lagari-brass-dim">Write a review</h3>
            <p className="mt-1 text-xs text-lagari-muted">
              Reviews from verified buyers appear immediately. Others are checked
              in admin before publishing.
            </p>
          </div>

          {message && (
            <p className="rounded-sm border border-lagari-brass/30 bg-lagari-brass/10 px-3 py-2 text-sm text-lagari-brass">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-sm border border-lagari-danger/40 bg-lagari-danger/10 px-3 py-2 text-sm text-lagari-danger">
              {error}
            </p>
          )}

          <input
            required
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-sm border border-lagari-border bg-lagari-surface px-4 py-3 text-lagari-primary outline-none focus:border-lagari-brass"
          />

          <div>
            <p className="font-label mb-2 text-sm text-lagari-muted">Your rating</p>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <textarea
            required
            minLength={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="What did you think of the scent, longevity, and wear?"
            className="w-full resize-y rounded-sm border border-lagari-border bg-lagari-surface px-4 py-3 text-lagari-primary outline-none focus:border-lagari-brass"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-sm border border-lagari-brass px-6 py-3 font-label text-sm text-lagari-brass transition-colors hover:bg-lagari-brass/10 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </section>
  );
}
