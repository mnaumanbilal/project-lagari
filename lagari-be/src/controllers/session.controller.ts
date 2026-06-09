import type { Request, Response } from "express";
import { z } from "zod";
import { createSession, touchSession } from "../services/session.service";
import { AppError } from "../middleware/errorHandler";

const createBodySchema = z.object({
  visitorId: z.string().uuid().optional(),
});

export async function createAnalyticsSession(req: Request, res: Response) {
  const body = createBodySchema.safeParse(req.body ?? {});
  const visitorId = body.success ? body.data.visitorId : undefined;

  const session = await createSession({
    userAgent: req.header("user-agent") ?? undefined,
    referrer: req.header("referer") ?? undefined,
    visitorId,
  });
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
