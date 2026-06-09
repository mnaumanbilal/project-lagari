import Link from "next/link";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { CatalogProduct } from "@/lib/types/catalog";

type HomeProductsSectionProps = {
  products: CatalogProduct[];
};

export function HomeProductsSection({ products }: HomeProductsSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label text-lagari-brass-dim">Curated</p>
          <h2 className="font-display text-3xl font-semibold text-lagari-primary sm:text-4xl">
            New impressions
          </h2>
        </div>
        <Link
          href="/shop"
          className="font-label text-lagari-brass transition-colors duration-[var(--lagari-duration-fast)] hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
