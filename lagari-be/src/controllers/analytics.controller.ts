import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import * as analytics from "../services/analytics.service";
import { touchSession } from "../services/session.service";
import { ANALYTICS_EVENT_NAMES } from "../utils/analytics-dedup";

const eventSchema = z.object({
  eventName: z.enum(ANALYTICS_EVENT_NAMES),
  payload: z.record(z.string(), z.unknown()).optional().nullable(),
  clientTs: z.string().optional(),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(25),
  sessionId: z.string().uuid().optional(),
  visitorId: z.string().uuid().optional(),
});

export async function postAnalyticsBatch(req: Request, res: Response) {
  const parsed = batchSchema.parse(req.body);
  const sessionId = req.header("X-Session-Id") ?? parsed.sessionId;
  if (!sessionId) throw new AppError(400, "X-Session-Id required");

  const alive = await touchSession(sessionId);
  if (!alive) throw new AppError(401, "Session expired");

  await analytics.ingestEventBatch(sessionId, parsed.events);
  res.status(204).send();
}

export async function postAnalyticsEvent(req: Request, res: Response) {
  const sessionId = req.header("X-Session-Id");
  if (!sessionId) throw new AppError(400, "X-Session-Id header required");

  const event = eventSchema.parse(req.body);
  const alive = await touchSession(sessionId);
  if (!alive) throw new AppError(401, "Session expired");

  await analytics.ingestEventBatch(sessionId, [event]);
  res.status(204).send();
}
