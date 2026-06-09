"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { buildGalleryImages } from "@/lib/product-gallery";
import { cloudinaryPresets } from "@/lib/media/cloudinary";
import type { CatalogProduct } from "@/lib/types/catalog";

type Props = {
  product: Pick<CatalogProduct, "title" | "heroImageUrl" | "hoverImageUrl" | "images">;
};

export function ProductGallery({ product }: Props) {
  const images = useMemo(() => buildGalleryImages(product), [product]);
  const heroIndex = Math.max(
    0,
    images.findIndex((img) => img.isHero),
  );
  const [activeIndex, setActiveIndex] = useState(heroIndex);
  const hasMultiple = images.length > 1;
  const activeImage = images[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= images.length) return;
      setActiveIndex(index);
    },
    [images.length],
  );

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[4/5] overflow-hidden rounded-sm border border-lagari-border bg-lagari-surface">
        {activeImage ? (
          <Image
            key={activeImage.url}
            src={cloudinaryPresets.productGalleryMain(activeImage.url)}
            alt={product.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : null}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-lagari-border/80 bg-lagari-deep/70 text-lagari-primary opacity-0 backdrop-blur-sm transition-opacity duration-[var(--lagari-duration-fast)] group-hover:opacity-100 hover:border-lagari-brass/50 hover:text-lagari-brass"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-lagari-border/80 bg-lagari-deep/70 text-lagari-primary opacity-0 backdrop-blur-sm transition-opacity duration-[var(--lagari-duration-fast)] group-hover:opacity-100 hover:border-lagari-brass/50 hover:text-lagari-brass"
              aria-label="Next image"
            >
              ›
            </button>
            <p className="absolute bottom-3 right-3 rounded-sm bg-lagari-deep/70 px-2 py-1 text-xs text-lagari-muted backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </p>
          </>
        )}
      </div>

      {hasMultiple && (
        <ul
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label={`${product.title} images`}
        >
          {images.map((img, idx) => {
            const selected = idx === activeIndex;
            return (
              <li key={`${img.url}-${idx}`} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={`Show image ${idx + 1}`}
                  onClick={() => goTo(idx)}
                  className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-sm border transition-colors duration-[var(--lagari-duration-fast)] ease-[var(--lagari-ease-out)] sm:h-20 sm:w-[4.5rem] ${
                    selected
                      ? "border-lagari-brass ring-1 ring-lagari-brass/40"
                      : "border-lagari-border opacity-75 hover:border-lagari-brass/40 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={cloudinaryPresets.productGalleryThumb(img.url)}
                    alt=""
                    fill
                    loading="lazy"
                    sizes="72px"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
