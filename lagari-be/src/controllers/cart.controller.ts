import type { Request, Response } from "express";
import { z } from "zod";
import { Product, ProductVariant } from "../db/models";
import { AppError } from "../middleware/errorHandler";
import { getProductHeroImageUrl } from "../services/catalog.service";
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

async function buildCartLine(
  variant: ProductVariant & { product?: Product },
  quantity: number,
): Promise<CartLine> {
  const product = variant.product!;
  const imageUrl = await getProductHeroImageUrl(product.id);
  return {
    variantId: variant.id,
    productTitle: product.title,
    productSlug: product.slug,
    variantName: variant.name,
    quantity,
    unitPricePkr: variant.pricePkr,
    imageUrl: imageUrl ?? undefined,
  };
}

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
  const freshLine = await buildCartLine(
    variant as ProductVariant & { product: Product },
    body.quantity,
  );

  const items: CartLine[] = existing
    ? cart.items.map((i) =>
        i.variantId === body.variantId
          ? {
              ...freshLine,
              imageUrl: freshLine.imageUrl ?? i.imageUrl,
              productSlug: freshLine.productSlug || i.productSlug,
            }
          : i,
      )
    : [...cart.items, freshLine];

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
