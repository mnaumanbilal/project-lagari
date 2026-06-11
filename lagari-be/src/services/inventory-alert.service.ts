import { Product, ProductVariant } from "../db/models";
import {
  notifyLowStock,
  shouldEmitLowStock,
} from "./notification.service";

export async function checkVariantLowStock(variantId: string): Promise<void> {
  const variant = await ProductVariant.findByPk(variantId, {
    include: [{ model: Product, as: "product", attributes: ["id", "title"] }],
  });
  if (!variant || !variant.isActive) return;
  if (variant.stock > variant.lowStockThreshold) return;

  const shouldEmit = await shouldEmitLowStock(variant.id);
  if (!shouldEmit) return;

  const product = (variant as ProductVariant & { product?: Product }).product;
  await notifyLowStock({
    productId: product?.id ?? variant.productId,
    productTitle: product?.title ?? "Product",
    variantName: variant.name,
    sku: variant.sku,
    stock: variant.stock,
    threshold: variant.lowStockThreshold,
  });
}
