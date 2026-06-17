import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../middleware/errorHandler";
import { withRetry } from "../retry";

const fast = { baseDelayMs: 1, maxDelayMs: 2, jitter: false } as const;

describe("withRetry", () => {
  it("returns immediately on success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn, fast)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: "ECONNRESET" })
      .mockResolvedValue("ok");
    await expect(withRetry(fn, fast)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("gives up after maxAttempts and rethrows", async () => {
    const fn = vi.fn().mockRejectedValue({ code: "ETIMEDOUT" });
    await expect(withRetry(fn, { ...fast, maxAttempts: 3 })).rejects.toMatchObject({
      code: "ETIMEDOUT",
    });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("never retries business errors (4xx)", async () => {
    const fn = vi.fn().mockRejectedValue(new AppError(409, "limit reached"));
    await expect(withRetry(fn, fast)).rejects.toBeInstanceOf(AppError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("honours a custom isRetryable predicate", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("custom"));
    await expect(
      withRetry(fn, { ...fast, maxAttempts: 2, isRetryable: () => true }),
    ).rejects.toThrow("custom");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
