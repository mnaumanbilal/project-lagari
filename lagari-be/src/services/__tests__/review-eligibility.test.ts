import { describe, expect, it } from "vitest";
import { VERIFIED_ORDER_STATUSES } from "../review.service";

describe("review eligibility order statuses", () => {
  it("excludes pending so COD orders must be confirmed before review", () => {
    expect(VERIFIED_ORDER_STATUSES).not.toContain("pending");
    expect(VERIFIED_ORDER_STATUSES).toEqual(
      expect.arrayContaining(["confirmed", "shipped", "delivered"]),
    );
  });
});
