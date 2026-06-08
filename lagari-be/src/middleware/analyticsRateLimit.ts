import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";

const windowMs = 60_000;
const maxBatches = 12;
const hits = new Map<string, { count: number; resetAt: number }>();

export function analyticsRateLimit(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const bodySession =
    req.body &&
    typeof req.body === "object" &&
    "sessionId" in req.body &&
    typeof (req.body as { sessionId?: string }).sessionId === "string"
      ? (req.body as { sessionId: string }).sessionId
      : undefined;
  const sessionId = req.header("X-Session-Id") ?? bodySession;
  if (!sessionId) {
    next(new AppError(400, "X-Session-Id required"));
    return;
  }

  const now = Date.now();
  const entry = hits.get(sessionId);
  if (!entry || now >= entry.resetAt) {
    hits.set(sessionId, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (entry.count >= maxBatches) {
    next(new AppError(429, "Too many analytics batches"));
    return;
  }

  entry.count += 1;
  next();
}
