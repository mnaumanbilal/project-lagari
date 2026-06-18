"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StarRating } from "@/components/storefront/StarRating";
import { USE_API } from "@/lib/api/config";
import {
  EMPTY_SUMMARY,
  fetchProductReviews,
  fetchReviewEligibility,
  submitProductReview,
  type ProductReview,
  type ReviewSummary,
} from "@/lib/api/reviews";
import { useSession } from "@/lib/session/session-context";
import { useStorefrontToast } from "@/lib/storefront/toast-context";
import {
  eligibilityToFieldErrors,
  parseStorefrontApiError,
  reportStorefrontErrors,
  type StorefrontFieldErrors,
} from "@/lib/storefront/api-errors";

/** How long to wait after the user stops typing before checking eligibility (ms). */
const ELIGIBILITY_DEBOUNCE_MS = 700;

/** Minimum contact input before hitting the eligibility API (avoids spam while typing). */
function hasEnoughContactForCheck(phone: string, email: string): boolean {
  const p = phone.replace(/\D/g, "");
  const e = email.trim();
  if (e.includes("@") && e.length >= 5) return true;
  if (p.length >= 10) return true;
  return false;
}

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

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-lagari-danger">
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ProductReviews({ slug }: { slug: string }) {
  const { sessionId } = useSession();
  const toast = useStorefrontToast();

  // --- Loaded reviews ---
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(EMPTY_SUMMARY);

  // --- Form state ---
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // --- Eligibility + field errors ---
  const [fieldErrors, setFieldErrors] = useState<StorefrontFieldErrors>({});
  const [eligibilityOk, setEligibilityOk] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const eligibilityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic id so a slow/stale eligibility response can't overwrite a newer one.
  const eligibilitySeq = useRef(0);
  const eligibilityAbort = useRef<AbortController | null>(null);
  /** Only check eligibility after the user edits contact — never on mount/autofill alone. */
  const contactEdited = useRef(false);

  // --- Submission state ---
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Load published reviews ---
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

  // --- Debounced eligibility check (user-driven only — no mount effect) ---
  const triggerEligibilityCheck = useCallback(
    (phone: string, email: string) => {
      if (!USE_API) return;

      if (eligibilityTimer.current) clearTimeout(eligibilityTimer.current);
      eligibilityAbort.current?.abort();
      eligibilityAbort.current = null;

      if (!phone.trim() && !email.trim()) {
        setEligibilityOk(false);
        setEligibilityLoading(false);
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.contactPhone;
          delete next.contactEmail;
          delete next._contact;
          return next;
        });
        return;
      }

      if (!contactEdited.current || !hasEnoughContactForCheck(phone, email)) {
        setEligibilityOk(false);
        setEligibilityLoading(false);
        return;
      }

      const seq = ++eligibilitySeq.current;
      eligibilityTimer.current = setTimeout(async () => {
        const controller = new AbortController();
        eligibilityAbort.current = controller;
        setEligibilityLoading(true);
        try {
          const result = await fetchReviewEligibility(
            slug,
            {
              contactPhone: phone.trim() || undefined,
              contactEmail: email.trim() || undefined,
            },
            { signal: controller.signal },
          );

          // Ignore if a newer check started while this one was in flight.
          if (seq !== eligibilitySeq.current) return;

          if (result.canSubmit) {
            setEligibilityOk(true);
            // Clear any previous contact errors
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.contactPhone;
              delete next.contactEmail;
              delete next._contact;
              return next;
            });
          } else {
            setEligibilityOk(false);
            // Only show contact-field errors inline during live check;
            // skip transient states (still-typing) to avoid nagging
            if (
              result.reason !== "contact_required" &&
              result.reason !== "contact_invalid"
            ) {
              const errs = eligibilityToFieldErrors(result);
              setFieldErrors((prev) => ({ ...prev, ...errs }));
            }
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Non-critical — silently ignore network errors during the live
          // check. Never show a false green tick on failure.
          if (seq === eligibilitySeq.current) setEligibilityOk(false);
        } finally {
          if (seq === eligibilitySeq.current) setEligibilityLoading(false);
        }
      }, ELIGIBILITY_DEBOUNCE_MS);
    },
    [slug],
  );

  function handleContactChange(phone: string, email: string) {
    contactEdited.current = true;
    triggerEligibilityCheck(phone, email);
  }

  // Cancel pending eligibility work on unmount.
  useEffect(() => {
    return () => {
      if (eligibilityTimer.current) clearTimeout(eligibilityTimer.current);
      eligibilityAbort.current?.abort();
    };
  }, []);

  // --- Submit ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!USE_API) return;

    setFieldErrors({});
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await submitProductReview(
        slug,
        {
          authorName,
          rating,
          body,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
        },
        sessionId,
      );
      setMessage(res.message);
      setBody("");
      setContactPhone("");
      setContactEmail("");
      setEligibilityOk(false);
      toast.success("Your review has been submitted.");
      await loadReviews();
    } catch (err) {
      const errs = parseStorefrontApiError(err);
      reportStorefrontErrors(errs, { setFieldErrors, toast });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" className="mt-16 border-t border-lagari-border pt-12 scroll-mt-24">
      {/* Header + summary */}
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
            <p className="mt-2 text-sm text-lagari-muted">No published reviews yet.</p>
          )}
        </div>
      </div>

      {/* Rating distribution bars */}
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

      {/* Review list */}
      {reviews.length > 0 ? (
        <ul className="mt-8 space-y-6">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-sm border border-lagari-border bg-lagari-surface/50 p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StarRating value={r.rating} readonly size="sm" />
                <span className="font-medium text-lagari-primary">{r.authorName}</span>
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
              <p className="mt-3 text-sm leading-relaxed text-lagari-muted">{r.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-lagari-muted">
          Be the first to share your experience with this fragrance.
        </p>
      )}

      {/* Review submission form */}
      {USE_API && (
        <form onSubmit={handleSubmit} className="mt-10 max-w-lg space-y-5">
          <div>
            <h3 className="font-label text-lagari-brass-dim">Write a review</h3>
            <p className="mt-1 text-xs text-lagari-muted">
              Only verified buyers can publish reviews. Please provide the contact
              you used when placing your order.
            </p>
          </div>

          {/* Feedback banners */}
          {message && (
            <p className="rounded-sm border border-lagari-brass/30 bg-lagari-brass/10 px-3 py-2 text-sm text-lagari-brass">
              {message}
            </p>
          )}
          {fieldErrors._form && (
            <p className="rounded-sm border border-lagari-danger/40 bg-lagari-danger/10 px-3 py-2 text-sm text-lagari-danger">
              {fieldErrors._form}
            </p>
          )}

          {/* Contact fields — primary verification mechanism */}
          <fieldset
            className="space-y-3"
            data-storefront-field="contact"
            aria-invalid={Boolean(fieldErrors._contact) || undefined}
          >
            <legend className="text-xs font-medium text-lagari-muted uppercase tracking-wide">
              Your order contact (at least one required)
            </legend>

            <p className="text-xs text-lagari-muted">
              Please provide the phone number or email address you used when placing
              your order. We use this to verify your purchase.
            </p>

            <div data-storefront-field="contactPhone">
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => {
                  const next = e.target.value;
                  setContactPhone(next);
                  handleContactChange(next, contactEmail);
                }}
                onBlur={() => handleContactChange(contactPhone, contactEmail)}
                placeholder="Phone number (e.g. 0311-1234567)"
                autoComplete="tel"
                aria-describedby={fieldErrors.contactPhone ? "contactPhone-err" : undefined}
                className={`w-full rounded-sm border bg-lagari-surface px-4 py-3 text-lagari-primary outline-none focus:border-lagari-brass ${
                  fieldErrors.contactPhone ? "border-lagari-danger" : "border-lagari-border"
                }`}
              />
              {fieldErrors.contactPhone && (
                <FieldError message={fieldErrors.contactPhone} />
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-lagari-muted">
              <div className="flex-1 border-t border-lagari-border" />
              <span>or</span>
              <div className="flex-1 border-t border-lagari-border" />
            </div>

            <div data-storefront-field="contactEmail">
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => {
                  const next = e.target.value;
                  setContactEmail(next);
                  handleContactChange(contactPhone, next);
                }}
                onBlur={() => handleContactChange(contactPhone, contactEmail)}
                placeholder="Email address"
                autoComplete="email"
                aria-describedby={fieldErrors.contactEmail ? "contactEmail-err" : undefined}
                className={`w-full rounded-sm border bg-lagari-surface px-4 py-3 text-lagari-primary outline-none focus:border-lagari-brass ${
                  fieldErrors.contactEmail ? "border-lagari-danger" : "border-lagari-border"
                }`}
              />
              {fieldErrors.contactEmail && (
                <FieldError message={fieldErrors.contactEmail} />
              )}
            </div>

            {/* Contact-level message (e.g. no purchase found, limit reached) */}
            {fieldErrors._contact && (
              <p role="alert" className="text-xs text-lagari-danger">
                {fieldErrors._contact}
              </p>
            )}

            {/* Live status */}
            <div className="min-h-4">
              {eligibilityLoading ? (
                <p className="animate-pulse text-xs text-lagari-muted">
                  Checking purchase history…
                </p>
              ) : eligibilityOk ? (
                <p className="text-xs text-lagari-brass">
                  ✓ Verified purchase found — you can submit this review.
                </p>
              ) : null}
            </div>
          </fieldset>

          {/* Review content */}
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
            disabled={submitting || !eligibilityOk}
            className="rounded-sm border border-lagari-brass px-6 py-3 font-label text-sm text-lagari-brass transition-colors hover:bg-lagari-brass/10 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </section>
  );
}
