import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import { placeCodOrder } from "../services/order.service";

const codSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  city: z.string().min(2),
  address: z.string().min(5),
  email: z.string().email().optional(),
});

export async function placeCodCheckout(req: Request, res: Response) {
  const body = codSchema.parse(req.body);
  const idempotencyKey = req.header("idempotency-key")?.trim() || undefined;
  try {
    const result = await placeCodOrder({
      sessionId: req.sessionId!,
      idempotencyKey,
      ...body,
    });
    if (!result) throw new AppError(409, "Cart is empty");
    res.status(201).json(result);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Insufficient stock")) {
      throw new AppError(409, e.message);
    }
    throw e;
  }
}
