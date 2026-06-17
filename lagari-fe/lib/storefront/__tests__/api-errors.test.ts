import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { ReviewEligibilityResult } from "@/lib/api/reviews";
import {
  eligibilityToFieldErrors,
  parseStorefrontApiError,
} from "@/lib/storefront/api-errors";

type Failure = Extract<ReviewEligibilityResult, { canSubmit: false }>;

describe("eligibilityToFieldErrors", () => {
  it("maps structured field=contact (limit reached) to _contact", () => {
    const result: Failure = {
      canSubmit: false,
      reason: "limit_reached",
      code: "REVIEW_LIMIT_REACHED",
      field: "contact",
      message: "You've already reviewed this product.",
    };
    expect(eligibilityToFieldErrors(result)).toEqual({
      _contact: result.message,
    });
  });

  it("maps field=phone to contactPhone", () => {
    const result: Failure = {
      canSubmit: false,
      reason: "contact_invalid",
      code: "CONTACT_INVALID",
      field: "phone",
      message: "Invalid phone.",
    };
    expect(eligibilityToFieldErrors(result)).toEqual({
      contactPhone: result.message,
    });
  });

  it("maps field=email to contactEmail", () => {
    const result: Failure = {
      canSubmit: false,
      reason: "ambiguous_email",
      code: "AMBIGUOUS_EMAIL",
      field: "email",
      message: "Ambiguous email.",
    };
    expect(eligibilityToFieldErrors(result)).toEqual({
      contactEmail: result.message,
    });
  });

  it("falls back to reason when field is absent (older backend)", () => {
    const result = {
      canSubmit: false,
      reason: "no_purchase",
      message: "No purchase found.",
    } as Failure;
    expect(eligibilityToFieldErrors(result)).toEqual({
      _contact: result.message,
    });
  });
});

describe("parseStorefrontApiError", () => {
  it("prefers the structured field from the payload", () => {
    const err = new ApiError(409, "Limit reached", {
      field: "contact",
      code: "REVIEW_LIMIT_REACHED",
    });
    expect(parseStorefrontApiError(err)).toEqual({ _contact: "Limit reached" });
  });

  it("maps a phone field to contactPhone", () => {
    const err = new ApiError(422, "Bad phone", { field: "phone" });
    expect(parseStorefrontApiError(err)).toEqual({ contactPhone: "Bad phone" });
  });

  it("maps 429 to a form-level message (never a field error)", () => {
    const err = new ApiError(429, "Too many submissions. Please wait.");
    const out = parseStorefrontApiError(err);
    expect(out._form).toBe("Too many submissions. Please wait.");
    expect(out.contactPhone).toBeUndefined();
  });

  it("hides internals for 5xx", () => {
    const err = new ApiError(500, "stack trace leak");
    const out = parseStorefrontApiError(err);
    expect(out._form).toBe(
      "Something went wrong on our end. Please try again in a moment.",
    );
  });

  it("returns a connection message for non-HTTP errors", () => {
    const out = parseStorefrontApiError(new TypeError("Failed to fetch"));
    expect(out._form).toContain("connection");
  });
});
