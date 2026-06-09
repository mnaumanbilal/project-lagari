import type { CatalogProduct, ProductVariant } from "@/lib/types/catalog";

export function isVariantPurchasable(variant: ProductVariant): boolean {
  if (variant.inStock === false) return false;
  return (variant.stock ?? 1) > 0;
}

export function getDefaultVariant(
  product: Pick<CatalogProduct, "variants">,
): ProductVariant | undefined {
  const variants = (product.variants ?? []).filter(isVariantPurchasable);
  if (!variants.length) return undefined;
  return variants.reduce((a, b) => (a.pricePkr <= b.pricePkr ? a : b));
}

export function getMaxStock(variant: ProductVariant): number {
  return Math.max(0, variant.stock ?? 99);
}
