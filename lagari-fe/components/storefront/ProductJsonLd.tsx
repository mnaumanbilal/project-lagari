import type { CatalogProduct } from "@/lib/types/catalog";
import { buildProductJsonLd } from "@/lib/seo/product-metadata";

type Props = {
  product: CatalogProduct;
  slug: string;
};

export function ProductJsonLd({ product, slug }: Props) {
  const jsonLd = buildProductJsonLd(product, slug);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
