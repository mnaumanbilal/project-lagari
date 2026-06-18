import type { Request, Response } from "express";
import { z } from "zod";
import { migrateCart } from "../services/cart.service";
import { createSession, touchSession } from "../services/session.service";
import { AppError } from "../middleware/errorHandler";

const createBodySchema = z.object({
  visitorId: z.string().uuid().optional(),
  previousSessionId: z.string().uuid().optional(),
});

export async function createAnalyticsSession(req: Request, res: Response) {
  const body = createBodySchema.safeParse(req.body ?? {});
  const visitorId = body.success ? body.data.visitorId : undefined;
  const previousSessionId = body.success ? body.data.previousSessionId : undefined;

  const session = await createSession({
    userAgent: req.header("user-agent") ?? undefined,
    referrer: req.header("referer") ?? undefined,
    visitorId,
  });

  if (previousSessionId && previousSessionId !== session.id) {
    await migrateCart(previousSessionId, session.id);
  }
  const expiresAt = new Date(
    session.lastActivityAt.getTime() + 30 * 60 * 1000,
  );
  res.status(201).json({
    id: session.id,
    visitorId: session.visitorId,
    expiresAt: expiresAt.toISOString(),
  });
}

export async function touchAnalyticsSession(req: Request, res: Response) {
  const ok = await touchSession(String(req.params.sessionId));
  if (!ok) throw new AppError(401, "Session expired or invalid");
  res.status(204).send();
}
