import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import * as notificationService from "../services/notification.service";

export async function createStreamToken(req: Request, res: Response) {
  const adminId = req.adminId;
  if (!adminId) throw new AppError(401, "Unauthorized");
  res.json({
    token: notificationService.createNotificationStreamToken(adminId),
    expiresInSeconds: 300,
  });
}

export async function streamNotifications(req: Request, res: Response) {
  const token = String(req.query.token ?? "");
  if (!token) {
    throw new AppError(401, "Missing stream token");
  }

  let adminId: string;
  try {
    adminId = notificationService.verifyNotificationStreamToken(token);
  } catch {
    throw new AppError(401, "Invalid or expired stream token");
  }
  void adminId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send("connected", { ok: true });

  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 25_000);

  const unsubscribe = notificationService.subscribeAdminStream((payload) => {
    send("notification", payload);
  });

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
}

const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export async function listNotifications(req: Request, res: Response) {
  const query = listQuery.parse(req.query);
  res.json(await notificationService.listNotifications(query));
}

export async function getUnreadCount(_req: Request, res: Response) {
  res.json({ count: await notificationService.getUnreadCount() });
}

const markReadBody = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});

export async function markNotificationsRead(req: Request, res: Response) {
  const body = markReadBody.parse(req.body);
  const updated = await notificationService.markNotificationsRead(body);
  res.json({ updated, unreadCount: await notificationService.getUnreadCount() });
}
