import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Correlation id for this request — used in error logs and responses. */
      requestId?: string;
    }
  }
}

/**
 * Attach a correlation id to every request. Honours an inbound `X-Request-Id`
 * (e.g. from an upstream proxy) when present and reasonable, otherwise mints one.
 * The id is echoed back on the response header for client-side support.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("X-Request-Id");
  const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
