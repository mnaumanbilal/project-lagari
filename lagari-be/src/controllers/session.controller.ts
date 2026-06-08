import type { Request, Response } from "express";
import { createSession, touchSession } from "../services/session.service";
import { AppError } from "../middleware/errorHandler";

export async function createAnalyticsSession(req: Request, res: Response) {
  const session = await createSession({
    userAgent: req.header("user-agent") ?? undefined,
    referrer: req.header("referer") ?? undefined,
  });
  const expiresAt = new Date(
    session.lastActivityAt.getTime() + 30 * 60 * 1000,
  );
  res.status(201).json({ id: session.id, expiresAt: expiresAt.toISOString() });
}

export async function touchAnalyticsSession(req: Request, res: Response) {
  const ok = await touchSession(String(req.params.sessionId));
  if (!ok) throw new AppError(401, "Session expired or invalid");
  res.status(204).send();
}
