import { ShopCatalog } from "@/components/storefront/ShopCatalog";
import { listCategories, listNoteTags, listProducts } from "@/lib/catalog";

export const revalidate = 300;

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
