import { HeroBanner } from "@/components/storefront/HeroBanner";
import { HomeProductsSection } from "@/components/storefront/HomeProductsSection";
import { listProducts } from "@/lib/catalog";

export const revalidate = 60;

export default async function HomePage() {
  const products = await listProducts();

  return (
    <>
      <HeroBanner />

      <HomeProductsSection products={products} />

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
