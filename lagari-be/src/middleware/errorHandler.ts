import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

/** Optional structured metadata so clients can map an error to a field/code. */
export type AppErrorOptions = {
  /** Machine-readable code, e.g. "REVIEW_LIMIT_REACHED". */
  code?: string;
  /** Form field or section the message belongs under, e.g. "contact". */
  field?: string;
};

export class AppError extends Error {
  public readonly code?: string;
  public readonly field?: string;

  constructor(
    public statusCode: number,
    message: string,
    options?: AppErrorOptions,
  ) {
    super(message);
    this.code = options?.code;
    this.field = options?.field;
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.flatten().fieldErrors,
      issues: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    // Intentional, client-visible errors — only log server-side faults (5xx).
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.requestId }, err.message);
    }
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
      ...(err.field ? { field: err.field } : {}),
    });
    return;
  }

  // Unexpected error — log full detail server-side, return a generic message.
  logger.error({ err, requestId: req.requestId }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
}
