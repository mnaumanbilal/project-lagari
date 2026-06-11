import type { Request, Response } from "express";
import { z } from "zod";
import { env, isWebPushConfigured } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import {
  removeCustomerPushSubscription,
  upsertCustomerPushSubscription,
} from "../services/push-subscription.service";

export async function getPushConfig(_req: Request, res: Response) {
  res.json({
    supported: isWebPushConfigured(),
    publicKey: isWebPushConfigured() ? env.webPush.publicKey : null,
  });
}

const subscribeBody = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  customerId: z.string().uuid().optional(),
});

export async function subscribePush(req: Request, res: Response) {
  if (!isWebPushConfigured()) {
    throw new AppError(503, "Push notifications are not configured");
  }
  const sessionId = req.sessionId;
  if (!sessionId) throw new AppError(400, "Session required");

  const body = subscribeBody.parse(req.body);
  await upsertCustomerPushSubscription({
    sessionId,
    customerId: body.customerId ?? null,
    subscription: { endpoint: body.endpoint, keys: body.keys },
    userAgent: req.header("user-agent") ?? null,
  });

  res.status(201).json({ ok: true });
}

const unsubscribeBody = z.object({
  endpoint: z.string().url(),
});

export async function unsubscribePush(req: Request, res: Response) {
  const sessionId = req.sessionId;
  if (!sessionId) throw new AppError(400, "Session required");

  const body = unsubscribeBody.parse(req.body);
  await removeCustomerPushSubscription(sessionId, body.endpoint);
  res.json({ ok: true });
}
