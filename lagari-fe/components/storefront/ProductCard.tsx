"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductCartActions } from "@/components/storefront/ProductCartActions";
import { formatPkr } from "@/lib/format";
import { cloudinaryPresets } from "@/lib/media/cloudinary";
import type { CatalogProduct } from "@/lib/types/catalog";

const FALLBACK_HERO = cloudinaryPresets.productCard(
  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
);

type ProductCardProps = {
  product: CatalogProduct;
  featured?: boolean;
};

/**
 * Hover motion: transform only the inner media wrapper — never the card shell.
 * CTA buttons live inside the card border, below the linked product area.
 */
export function ProductCard({ product, featured = false }: ProductCardProps) {
  const hero = cloudinaryPresets.productCard(product.heroImageUrl) || FALLBACK_HERO;
  const hover = product.hoverImageUrl
    ? cloudinaryPresets.productCard(product.hoverImageUrl)
    : undefined;
  const hasHoverImage = Boolean(hover && hover !== hero);

  return (
    <article
      className={
        featured
          ? "group relative col-span-1 row-span-2 flex flex-col overflow-hidden rounded-sm border border-lagari-border bg-lagari-surface transition-[border-color,box-shadow] duration-[var(--lagari-duration-medium)] ease-[var(--lagari-ease-out)] hover:border-lagari-brass/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] md:col-span-2"
          : "group relative flex flex-col overflow-hidden rounded-sm border border-lagari-border bg-lagari-surface transition-[border-color,box-shadow] duration-[var(--lagari-duration-medium)] ease-[var(--lagari-ease-out)] hover:border-lagari-brass/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      }
    >
      <Link
        href={`/product/${product.slug}`}
        className="flex flex-1 flex-col"
      >
        <div
          className={
            featured
              ? "relative aspect-[4/5] w-full overflow-hidden sm:aspect-[3/4]"
              : "relative aspect-[4/5] w-full overflow-hidden"
          }
        >
          <div className="product-card-media-zoom relative h-full w-full">
            <Image
              src={hero}
              alt={product.title}
              fill
              sizes={
                featured
                  ? "(max-width:768px) 100vw, 50vw"
                  : "(max-width:768px) 50vw, 33vw"
              }
              className={`object-cover ${
                hasHoverImage
                  ? "product-card-img-hover opacity-100 group-hover:opacity-0"
                  : ""
              }`}
            />
            {hasHoverImage && hover && (
              <Image
                src={hover}
                alt=""
                aria-hidden
                fill
                loading="lazy"
                sizes={
                  featured
                    ? "(max-width:768px) 100vw, 50vw"
                    : "(max-width:768px) 50vw, 33vw"
                }
                className="product-card-img-hover object-cover opacity-0 group-hover:opacity-100"
              />
            )}
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-lagari-deep/90 via-lagari-deep/30 to-transparent"
            aria-hidden
          />
        </div>

        <div className="flex flex-col gap-0.5 p-3 sm:gap-1 sm:p-5">
          {product.designerInspiration && (
            <p className="font-label break-words text-[0.65rem] leading-snug text-lagari-brass-dim sm:text-xs sm:leading-relaxed">
              Inspired by {product.designerInspiration}
            </p>
          )}
          <h2 className="font-display line-clamp-2 text-base font-semibold leading-snug text-lagari-primary sm:text-2xl sm:leading-tight lg:text-3xl">
            {product.title}
          </h2>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {product.fromCompareAtPricePkr != null &&
            product.fromCompareAtPricePkr > product.fromPricePkr ? (
              <>
                <span className="font-display text-sm font-semibold text-lagari-primary sm:text-base">
                  {formatPkr(product.fromPricePkr)}
                </span>
                <span className="text-xs text-lagari-muted line-through sm:text-sm">
                  {formatPkr(product.fromCompareAtPricePkr)}
                </span>
              </>
            ) : (
              <span className="text-xs text-lagari-muted sm:text-sm">
                From {formatPkr(product.fromPricePkr)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="border-t border-lagari-border p-3 sm:p-5 sm:pt-4">
        <ProductCartActions product={product} layout="card" />
      </div>
    </article>
  );
}
