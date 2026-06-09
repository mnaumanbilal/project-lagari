import type { CatalogProduct } from "@/lib/types/catalog";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80";

export type GalleryImage = { url: string; isHero: boolean };

export function buildGalleryImages(
  product: Pick<CatalogProduct, "heroImageUrl" | "hoverImageUrl" | "images">,
): GalleryImage[] {
  if (product.images?.length) {
    return product.images;
  }

  const urls: string[] = [];
  if (product.heroImageUrl) urls.push(product.heroImageUrl);
  if (
    product.hoverImageUrl &&
    product.hoverImageUrl !== product.heroImageUrl
  ) {
    urls.push(product.hoverImageUrl);
  }
  if (!urls.length) urls.push(FALLBACK_HERO);

  return urls.map((url, idx) => ({ url, isHero: idx === 0 }));
}
