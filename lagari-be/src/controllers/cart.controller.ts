import type { Request, Response } from "express";
import { z } from "zod";
import { Product, ProductVariant } from "../db/models";
import { AppError } from "../middleware/errorHandler";
import {
  computeSubtotal,
  getCart,
  saveCart,
  type CartLine,
} from "../services/cart.service";

export async function getCartHandler(req: Request, res: Response) {
  res.json(await getCart(req.sessionId!));
}

const addSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export async function upsertCartItem(req: Request, res: Response) {
  const body = addSchema.parse(req.body);
  const variant = await ProductVariant.findByPk(body.variantId, {
    include: [{ model: Product, as: "product" }],
  });
  if (!variant?.isActive || variant.stock < body.quantity) {
    throw new AppError(400, "Variant unavailable");
  }
  const product = (variant as ProductVariant & { product?: Product }).product;
  if (!product?.isPublished || product.deletedAt) {
    throw new AppError(400, "Product unavailable");
  }

  const cart = await getCart(req.sessionId!);
  const existing = cart.items.find((i) => i.variantId === body.variantId);
  const items: CartLine[] = existing
    ? cart.items.map((i) =>
        i.variantId === body.variantId
          ? { ...i, quantity: body.quantity }
          : i,
      )
    : [
        ...cart.items,
        {
          variantId: variant.id,
          productTitle: product.title,
          variantName: variant.name,
          quantity: body.quantity,
          unitPricePkr: variant.pricePkr,
        },
      ];

  const payload = { items, subtotalPkr: computeSubtotal(items) };
  await saveCart(req.sessionId!, payload);
  res.json(payload);
}

export async function removeCartItem(req: Request, res: Response) {
  const cart = await getCart(req.sessionId!);
  const items = cart.items.filter((i) => i.variantId !== req.params.variantId);
  const payload = { items, subtotalPkr: computeSubtotal(items) };
  await saveCart(req.sessionId!, payload);
  res.json(payload);
}
