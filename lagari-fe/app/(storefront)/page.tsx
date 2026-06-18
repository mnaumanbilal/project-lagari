import { Suspense } from "react";
import type { Metadata } from "next";
import { HeroBanner } from "@/components/storefront/HeroBanner";
import { HomeProductsSection } from "@/components/storefront/HomeProductsSection";
import { StorefrontLoading } from "@/components/storefront/StorefrontLoading";
import { listProducts } from "@/lib/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Luxury Fragrance Impressions",
  description:
    "Discover artisanal impressions of iconic designer fragrances. Cash on delivery across Pakistan.",
  alternates: { canonical: "/" },
};

async function HomeProductsLoader() {
  const products = await listProducts();
  return <HomeProductsSection products={products} />;
}

export default function HomePage() {
  return (
    <>
      <HeroBanner />

      <Suspense fallback={<StorefrontLoading />}>
        <HomeProductsLoader />
      </Suspense>

      <section className="border-t border-lagari-border bg-lagari-elevated">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6">
          <p className="font-label text-lagari-brass">Cash on delivery</p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-lagari-muted">
            Name, phone, city, and address — that&apos;s all we need. Our team
            confirms every order before dispatch.
          </p>
        </div>
      </section>
    </>
  );
}
