import type { CatalogProduct } from "@/lib/types/catalog";

/** Product is on sale when any active variant has compare-at above current price. */
export function isProductOnSale(product: CatalogProduct): boolean {
  if (
    product.fromCompareAtPricePkr != null &&
    product.fromCompareAtPricePkr > product.fromPricePkr
  ) {
    return true;
  }
  return (product.variants ?? []).some(
    (v) =>
      v.isActive !== false &&
      v.compareAtPricePkr != null &&
      v.compareAtPricePkr > v.pricePkr,
  );
}

export function saleDiscountPercent(
  pricePkr: number,
  compareAtPricePkr: number,
): number {
  if (compareAtPricePkr <= pricePkr) return 0;
  return Math.round(((compareAtPricePkr - pricePkr) / compareAtPricePkr) * 100);
}
