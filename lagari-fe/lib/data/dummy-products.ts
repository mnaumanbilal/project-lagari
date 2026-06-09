export type ProductCategory = "for-men" | "for-women" | "unisex";
export type NoteTag = "oud" | "citrus" | "floral" | "woody" | "gourmand";
export type ScentProfile = "light" | "dark";

export type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  pricePkr: number;
  compareAtPricePkr?: number;
  stock: number;
};

export type DummyProduct = {
  slug: string;
  title: string;
  description: string;
  designerInspiration: string;
  scentProfile: ScentProfile;
  categories: ProductCategory[];
  noteTags: NoteTag[];
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  heroImageUrl: string;
  hoverImageUrl?: string;
  variants: ProductVariant[];
  featured?: boolean;
};

/** Test catalog — replace with API when lagari-be is connected */
export const DUMMY_PRODUCTS: DummyProduct[] = [
  {
    slug: "velocity",
    title: "Velocity - Inspired by CH Bad Boy",
    designerInspiration: "Carolina Herrera Bad Boy",
    description:
      "Bold. Electric. Unstoppable. Velocity is crafted for the modern man who moves with confidence — clean sophistication meets magnetic intensity.",
    scentProfile: "dark",
    categories: ["for-men"],
    noteTags: ["citrus", "woody"],
    topNotes: "Pink Pepper, Lime, Gin Tonic Accord",
    heartNotes: "Plum, Geranium, Cypress, Nutmeg",
    baseNotes: "Truffle Accord, Vetiver, Texas Cedarwood, Amber",
    heroImageUrl: "/products/velocity.png",
    hoverImageUrl:
      "https://www.lagari.pk/cdn/shop/files/rn-image_picker_lib_temp_26122126-acbd-4cc8-91fc-e2b08d125e56.png?v=1778198316",
    featured: true,
    variants: [
      {
        id: "vel-edp-50",
        sku: "VEL-EDP-50",
        name: "Eau De Parfum – 50ML",
        pricePkr: 3200,
        compareAtPricePkr: 3999,
        stock: 50,
      },
    ],
  },
  {
    slug: "desert-noir",
    title: "Desert Noir",
    designerInspiration: "Louis Vuitton Ombre Nomade",
    description:
      "A deep, resinous oud impression with amber warmth and a whisper of raspberry — composed for evening and special occasions.",
    scentProfile: "dark",
    categories: ["for-men", "unisex"],
    noteTags: ["oud", "woody"],
    topNotes: "Bergamot, Raspberry",
    heartNotes: "Oud, Rose",
    baseNotes: "Amber, Musk",
    heroImageUrl:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
    hoverImageUrl:
      "https://images.unsplash.com/photo-1594035910387-825bfedda501?w=800&q=80",
    featured: true,
    variants: [
      {
        id: "dn-50",
        sku: "DN-50",
        name: "50ml Extrait",
        pricePkr: 6500,
        stock: 24,
      },
      {
        id: "dn-100",
        sku: "DN-100",
        name: "100ml Extrait",
        pricePkr: 10500,
        stock: 12,
      },
    ],
  },
  {
    slug: "silver-ridge",
    title: "Silver Ridge",
    designerInspiration: "Dior Sauvage",
    description:
      "Bright bergamot and pepper open into lavender and ambroxan — a fresh, magnetic impression for daily wear.",
    scentProfile: "light",
    categories: ["for-men"],
    noteTags: ["citrus", "woody"],
    topNotes: "Calabrian Bergamot, Pepper",
    heartNotes: "Lavender, Geranium",
    baseNotes: "Ambroxan, Cedar",
    heroImageUrl:
      "https://images.unsplash.com/photo-1592945403247-bfd446f253d6?w=800&q=80",
    hoverImageUrl:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
    variants: [
      {
        id: "sr-50",
        sku: "SR-50",
        name: "50ml EDP",
        pricePkr: 4800,
        stock: 30,
      },
    ],
  },
  {
    slug: "velvet-rose",
    title: "Velvet Rose",
    designerInspiration: "Tom Ford Black Orchid",
    description:
      "Dark florals, truffle, and plum unfold on a satin base of patchouli and vanilla — unapologetically opulent.",
    scentProfile: "dark",
    categories: ["for-women", "unisex"],
    noteTags: ["floral", "gourmand"],
    topNotes: "Truffle, Bergamot",
    heartNotes: "Black Orchid, Lotus",
    baseNotes: "Patchouli, Vanilla",
    heroImageUrl:
      "https://images.unsplash.com/photo-1588405748880-12a358e19795?w=800&q=80",
    variants: [
      {
        id: "vr-50",
        sku: "VR-50",
        name: "50ml Parfum",
        pricePkr: 7200,
        stock: 18,
      },
    ],
  },
  {
    slug: "citrus-marine",
    title: "Citrus Marine",
    designerInspiration: "Creed Virgin Island Water",
    description:
      "Sun-warmed lime and coconut over a clean musk — an airy coastal impression for heat and travel.",
    scentProfile: "light",
    categories: ["unisex"],
    noteTags: ["citrus"],
    topNotes: "Lime, Coconut",
    heartNotes: "Ginger, Ylang",
    baseNotes: "White Musk, Cedar",
    heroImageUrl:
      "https://images.unsplash.com/photo-1615634260162-c517062c2fc0?w=800&q=80",
    variants: [
      {
        id: "cm-50",
        sku: "CM-50",
        name: "50ml EDT",
        pricePkr: 4200,
        stock: 40,
      },
    ],
  },
  {
    slug: "oud-velvet",
    title: "Oud Velvet",
    designerInspiration: "Initio Oud for Greatness",
    description:
      "Nutmeg and saffron ignite a velvety oud heart — bold, modern, and unmistakably luxurious.",
    scentProfile: "dark",
    categories: ["for-men", "unisex"],
    noteTags: ["oud", "gourmand"],
    topNotes: "Nutmeg, Saffron",
    heartNotes: "Oud, Lavender",
    baseNotes: "Musk, Patchouli",
    heroImageUrl:
      "https://images.unsplash.com/photo-1594035910387-825bfedda501?w=800&q=80",
    variants: [
      {
        id: "ov-50",
        sku: "OV-50",
        name: "50ml Extrait",
        pricePkr: 7800,
        stock: 15,
      },
    ],
  },
];

export const CATEGORY_LABELS: Record<ProductCategory | "all", string> = {
  all: "All",
  "for-men": "For Men",
  "for-women": "For Women",
  unisex: "Unisex",
};

/** Mirrors DB note_tags seed — used when API is off */
export const DUMMY_NOTE_TAGS: { slug: NoteTag; name: string }[] = [
  { slug: "citrus", name: "Citrus" },
  { slug: "floral", name: "Floral" },
  { slug: "gourmand", name: "Gourmand" },
  { slug: "oud", name: "Oud" },
  { slug: "woody", name: "Woody" },
];

export function getProductBySlug(slug: string): DummyProduct | undefined {
  return DUMMY_PRODUCTS.find((p) => p.slug === slug);
}

export function listProducts(filters?: {
  category?: string;
  note?: string;
  q?: string;
}): DummyProduct[] {
  let items = [...DUMMY_PRODUCTS];

  if (filters?.category && filters.category !== "all") {
    items = items.filter((p) =>
      p.categories.includes(filters.category as ProductCategory),
    );
  }

  if (filters?.note) {
    items = items.filter((p) => p.noteTags.includes(filters.note as NoteTag));
  }

  if (filters?.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.designerInspiration.toLowerCase().includes(q),
    );
  }

  return items;
}

export function fromPricePkr(product: DummyProduct): number {
  return Math.min(...product.variants.map((v) => v.pricePkr));
}

export function fromListPricing(product: DummyProduct): {
  fromPricePkr: number;
  fromCompareAtPricePkr: number | null;
} {
  const cheapest = product.variants.reduce((a, b) =>
    a.pricePkr <= b.pricePkr ? a : b,
  );
  const compare = cheapest.compareAtPricePkr;
  return {
    fromPricePkr: cheapest.pricePkr,
    fromCompareAtPricePkr:
      compare != null && compare > cheapest.pricePkr ? compare : null,
  };
}

export function formatPkr(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}
