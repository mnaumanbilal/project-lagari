import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { ZodError, z } from "zod";
import { AppError, errorHandler } from "../errorHandler";

function mockResponse() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const req = { requestId: "test-req" } as unknown as Request;
const next = vi.fn();

describe("errorHandler", () => {
  it("formats ZodError as 400 with issues", () => {
    const res = mockResponse();
    const zerr = (() => {
      try {
        z.object({ name: z.string() }).parse({});
        throw new Error("unreachable");
      } catch (e) {
        return e as ZodError;
      }
    })();

    errorHandler(zerr, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.error).toBe("Validation failed");
    expect(Array.isArray(body.issues)).toBe(true);
  });

  it("returns AppError status and message", () => {
    const res = mockResponse();
    errorHandler(new AppError(404, "Not found"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Not found" });
  });

  it("includes code and field when provided", () => {
    const res = mockResponse();
    errorHandler(
      new AppError(409, "Limit reached", {
        code: "REVIEW_LIMIT_REACHED",
        field: "contact",
      }),
      req,
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "Limit reached",
      code: "REVIEW_LIMIT_REACHED",
      field: "contact",
    });
  });

  it("hides internals for unknown errors (500)", () => {
    const res = mockResponse();
    errorHandler(new Error("secret stack detail"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
