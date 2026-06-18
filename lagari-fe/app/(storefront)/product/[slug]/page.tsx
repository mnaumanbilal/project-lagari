import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductJsonLd } from "@/components/storefront/ProductJsonLd";
import { ProductPurchase } from "@/components/storefront/ProductPurchase";
import { ProductRatingSummary } from "@/components/storefront/ProductRatingSummary";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { ProductShare } from "@/components/storefront/ProductShare";
import { ProductViewTracker } from "@/components/storefront/ProductViewTracker";
import {
  buildProductMetadata,
  buildProductShareText,
} from "@/lib/seo/product-metadata";
import { getAllProductSlugs, getProductBySlug } from "@/lib/catalog";

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return buildProductMetadata(product, slug);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <ProductJsonLd product={product} slug={slug} />
      <ProductViewTracker slug={slug} />
      <Link
        href="/shop"
        className="font-label text-lagari-muted transition-colors hover:text-lagari-brass"
      >
        ← Shop
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery product={product} />

        <div>
          {product.designerInspiration && (
            <p className="font-label text-lagari-brass">
              Inspired by {product.designerInspiration}
            </p>
          )}
          <h1 className="font-display mt-2 text-4xl font-semibold text-lagari-primary sm:text-5xl">
            {product.title}
          </h1>
          <ProductRatingSummary
            summary={product.reviewSummary}
            size="md"
            href="#reviews"
            className="mt-3"
          />
          <ProductShare slug={slug} shareText={buildProductShareText(product)} />
          {product.description && (
            <div
              className="prose-lagari mt-6 space-y-4 leading-relaxed text-lagari-muted [&_h3]:font-display [&_h3]:text-lg [&_h3]:text-lagari-primary [&_p]:mt-0 [&_strong]:text-lagari-primary"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {(product.topNotes || product.heartNotes || product.baseNotes) && (
            <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-lagari-border py-6 text-center text-sm">
              {product.topNotes && (
                <div>
                  <dt className="font-label text-lagari-brass-dim">Top</dt>
                  <dd className="mt-1 text-lagari-primary">{product.topNotes}</dd>
                </div>
              )}
              {product.heartNotes && (
                <div>
                  <dt className="font-label text-lagari-brass-dim">Heart</dt>
                  <dd className="mt-1 text-lagari-primary">
                    {product.heartNotes}
                  </dd>
                </div>
              )}
              {product.baseNotes && (
                <div>
                  <dt className="font-label text-lagari-brass-dim">Base</dt>
                  <dd className="mt-1 text-lagari-primary">{product.baseNotes}</dd>
                </div>
              )}
            </dl>
          )}

          <ProductPurchase product={product} />
        </div>
      </div>

      <ProductReviews slug={slug} />
    </div>
  );
}
