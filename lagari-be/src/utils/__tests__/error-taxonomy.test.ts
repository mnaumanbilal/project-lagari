import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler";
import { classifyError, isTransientError } from "../error-taxonomy";

describe("isTransientError", () => {
  it("treats 4xx AppError as non-transient (business rule)", () => {
    expect(isTransientError(new AppError(409, "limit reached"))).toBe(false);
    expect(isTransientError(new AppError(422, "no purchase"))).toBe(false);
  });

  it("treats 5xx AppError as transient", () => {
    expect(isTransientError(new AppError(503, "dependency down"))).toBe(true);
  });

  it("never retries validation errors", () => {
    const zerr = new ZodError([]);
    expect(isTransientError(zerr)).toBe(false);
  });

  it("detects transient system codes", () => {
    expect(isTransientError({ code: "ECONNRESET" })).toBe(true);
    expect(isTransientError({ code: "ETIMEDOUT" })).toBe(true);
    expect(isTransientError({ code: "EACCES" })).toBe(false);
  });

  it("detects transient HTTP statuses from dependency errors", () => {
    expect(isTransientError({ status: 502 })).toBe(true);
    expect(isTransientError({ statusCode: 503 })).toBe(true);
    expect(isTransientError({ status: 400 })).toBe(false);
  });

  it("detects Sequelize connection error names", () => {
    expect(isTransientError({ name: "ConnectionAcquireTimeoutError" })).toBe(true);
    expect(isTransientError({ name: "TimeoutError" })).toBe(true);
  });
});

describe("classifyError", () => {
  it("classifies categories correctly", () => {
    expect(classifyError(new ZodError([]))).toBe("validation");
    expect(classifyError(new AppError(409, "x"))).toBe("business");
    expect(classifyError(new AppError(500, "x"))).toBe("internal");
    expect(classifyError({ code: "ECONNRESET" })).toBe("transient");
    expect(classifyError(new Error("boom"))).toBe("internal");
  });
});
