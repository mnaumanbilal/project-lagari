import type { Metadata } from "next";
import { buildGalleryImages } from "@/lib/product-gallery";
import { cloudinaryPresets } from "@/lib/media/cloudinary";
import { getSiteUrl, resolveProductUrl } from "@/lib/site/url";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/site/placeholder-image";
import type { CatalogProduct } from "@/lib/types/catalog";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildProductShareDescription(product: CatalogProduct): string {
  const parts: string[] = [];
  if (product.designerInspiration) {
    parts.push(`Inspired by ${product.designerInspiration}.`);
  }
  if (product.description) {
    const plain = stripHtml(product.description);
    if (plain) parts.push(plain.slice(0, 160));
  }
  const notes = [product.topNotes, product.heartNotes, product.baseNotes]
    .filter(Boolean)
    .join(" · ");
  if (notes) parts.push(notes);
  parts.push("Cash on delivery across Pakistan.");
  return parts.join(" ").slice(0, 300);
}

export function buildProductShareText(product: CatalogProduct): string {
  const inspiration = product.designerInspiration
    ? ` — inspired by ${product.designerInspiration}`
    : "";
  return `${product.title}${inspiration}`;
}

function resolveOgImageUrl(product: CatalogProduct): string {
  const gallery = buildGalleryImages(product);
  const raw = gallery[0]?.url;
  const transformed = raw
    ? cloudinaryPresets.ogShare(raw)
    : "";
  if (transformed) return transformed;
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${PRODUCT_PLACEHOLDER_IMAGE}`;
}

export function buildProductMetadata(
  product: CatalogProduct,
  slug: string,
): Metadata {
  const description = buildProductShareDescription(product);
  const ogImage = resolveOgImageUrl(product);
  const title = `${product.title} — Lagari`;
  const canonical = `/product/${slug}`;

  return {
    title: product.title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: resolveProductUrl(slug),
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function buildProductJsonLd(
  product: CatalogProduct,
  slug: string,
): Record<string, unknown> {
  const gallery = buildGalleryImages(product);
  const image =
    gallery[0]?.url != null
      ? cloudinaryPresets.ogShare(gallery[0].url) || gallery[0].url
      : `${getSiteUrl().replace(/\/$/, "")}${PRODUCT_PLACEHOLDER_IMAGE}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: buildProductShareDescription(product),
    image,
    url: resolveProductUrl(slug),
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.fromPricePkr,
      availability: "https://schema.org/InStock",
      url: resolveProductUrl(slug),
    },
  };

  const summary = product.reviewSummary;
  if (summary && summary.totalCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: summary.averageRating,
      reviewCount: summary.totalCount,
    };
  }

  return jsonLd;
}
