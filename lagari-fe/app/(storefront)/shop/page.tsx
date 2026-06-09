import { Suspense } from "react";
import { ShopCatalog } from "@/components/storefront/ShopCatalog";
import { listCategories, listNoteTags, listProducts } from "@/lib/catalog";

export const revalidate = 60;

type ShopPageProps = {
  searchParams: Promise<{
    category?: string;
    note?: string;
    q?: string;
  }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const activeCategory = params.category ?? "all";

  const [categories, noteTags, initialProducts] = await Promise.all([
    listCategories(),
    listNoteTags(),
    listProducts({
      category: params.category,
      note: params.note,
      q: params.q,
    }),
  ]);

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-lagari-muted">Loading shop…</p>
        </div>
      }
    >
      <ShopCatalog
        categories={categories}
        noteTags={noteTags}
        initialCategory={activeCategory}
        initialNote={params.note}
        initialQuery={params.q ?? ""}
        initialProducts={initialProducts}
      />
    </Suspense>
  );
}
