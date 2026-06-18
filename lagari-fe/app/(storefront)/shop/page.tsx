import type { Metadata } from "next";
import { ShopCatalog } from "@/components/storefront/ShopCatalog";
import { listCategories, listNoteTags, listProducts } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse Lagari fragrance impressions — filter by scent profile and notes. COD across Pakistan.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [categories, noteTags, initialProducts] = await Promise.all([
    listCategories(),
    listNoteTags(),
    listProducts({}),
  ]);

  return (
    <ShopCatalog
      categories={categories}
      noteTags={noteTags}
      initialProducts={initialProducts}
    />
  );
}
