import { isVariantPurchasable } from "@/lib/cart/helpers";
import type { CartLine } from "@/lib/cart/cart-context";
import type { CatalogProduct } from "@/lib/types/catalog";

export type CheckoutSuggestion = {
  product: CatalogProduct;
  reason: string;
  score: number;
};

function intersect(a: string[] = [], b: Set<string>): string[] {
  return a.filter((value) => b.has(value));
}

function isPurchasable(product: CatalogProduct): boolean {
  return (product.variants ?? []).some(isVariantPurchasable);
}

function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, " ");
}

function buildReason(
  product: CatalogProduct,
  cartNoteTags: Set<string>,
  cartCategories: Set<string>,
): string {
  const sharedNotes = intersect(product.noteTags, cartNoteTags);
  if (sharedNotes.length > 0) {
    return `Pairs with your ${humanizeSlug(sharedNotes[0])} notes`;
  }

  const sharedCategories = intersect(product.categories, cartCategories).filter(
    (c) => c !== "all",
  );
  if (sharedCategories.length > 0) {
    return `From your ${humanizeSlug(sharedCategories[0])} selection`;
  }

  if (product.featured) {
    return "A house favourite";
  }

  return "Worth exploring before you check out";
}

/**
 * Rank catalog items not already in the bag. Re-scores when cart lines change
 * so suggestions refresh as the shopper adds more.
 */
export function pickCheckoutSuggestions(
  catalog: CatalogProduct[],
  cartLines: CartLine[],
  limit = 3,
): CheckoutSuggestion[] {
  if (!cartLines.length || !catalog.length) return [];

  const cartSlugs = new Set(cartLines.map((line) => line.productSlug));
  const cartProducts = catalog.filter((product) => cartSlugs.has(product.slug));

  const cartNoteTags = new Set(
    cartProducts.flatMap((product) => product.noteTags ?? []),
  );
  const cartCategories = new Set(
    cartProducts.flatMap((product) => product.categories ?? []),
  );
  const cartVariantIds = new Set(cartLines.map((line) => line.variantId));

  const scored: CheckoutSuggestion[] = [];

  for (const product of catalog) {
    if (cartSlugs.has(product.slug) || !isPurchasable(product)) continue;

    const purchasableVariants = (product.variants ?? []).filter(isVariantPurchasable);
    const allVariantsInCart = purchasableVariants.every((variant) =>
      cartVariantIds.has(variant.id),
    );
    if (allVariantsInCart) continue;

    let score = 0;

    for (const tag of product.noteTags ?? []) {
      if (cartNoteTags.has(tag)) score += 4;
    }

    for (const category of product.categories ?? []) {
      if (category !== "all" && cartCategories.has(category)) score += 2;
    }

    if (product.featured) score += 1;

    // Nudge variety when the bag already has several scents.
    if (cartLines.length >= 2) {
      const novelNotes = (product.noteTags ?? []).filter((tag) => !cartNoteTags.has(tag));
      if (novelNotes.length > 0) score += 1;
    }

    if (score === 0 && cartLines.length === 1) {
      score = 0.5;
    }

    if (score <= 0 && cartLines.length > 1) continue;

    scored.push({
      product,
      score,
      reason: buildReason(product, cartNoteTags, cartCategories),
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.product.fromPricePkr - b.product.fromPricePkr;
  });

  return scored.slice(0, limit);
}

export function suggestionHeadline(cartLineCount: number): string {
  if (cartLineCount <= 1) return "Complete your ritual";
  return "Pairs well with your bag";
}
