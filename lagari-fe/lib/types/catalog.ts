export type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  pricePkr: number;
  compareAtPricePkr?: number | null;
  stock?: number;
  isActive?: boolean;
  inStock?: boolean;
};

export type ReviewSummary = {
  averageRating: number;
  totalCount: number;
  distribution?: Record<string, number>;
};

export type CatalogProduct = {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  designerInspiration: string | null;
  heroImageUrl?: string;
  hoverImageUrl?: string;
  fromPricePkr: number;
  fromCompareAtPricePkr?: number | null;
  categories?: string[];
  noteTags?: string[];
  topNotes?: string;
  heartNotes?: string;
  baseNotes?: string;
  reviewSummary?: ReviewSummary | null;
  variants?: ProductVariant[];
  images?: { url: string; isHero: boolean }[];
  featured?: boolean;
};

export type ProductListResponse = {
  items: CatalogProduct[];
  page: number;
  total: number;
};

export type CategoryOption = { slug: string; name: string };

export type NoteTagOption = { slug: string; name: string };
