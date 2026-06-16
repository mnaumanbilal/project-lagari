import { Op } from "sequelize";
import {
  Category,
  NoteTag,
  Product,
  ProductImage,
  ProductVariant,
} from "../db/models";
import { optimizeDeliveryUrl } from "../utils/cloudinary-delivery";
import {
  getProductReviewSummary,
  getReviewSummariesForProducts,
} from "./review.service";

function mapVariant(v: ProductVariant) {
  return {
    id: v.id,
    sku: v.sku,
    name: v.name,
    pricePkr: v.pricePkr,
    compareAtPricePkr: v.compareAtPricePkr,
    stock: v.stock,
    inStock: v.stock > 0 && v.isActive,
  };
}

function sortedImages(images: ProductImage[]): ProductImage[] {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

function heroUrl(
  images: ProductImage[],
  size: "card" | "detail" = "card",
): string | undefined {
  const sorted = sortedImages(images);
  const hero = sorted.find((i) => i.isHero) ?? sorted[0];
  if (!hero?.url) return undefined;
  return optimizeDeliveryUrl(
    hero.url,
    size === "detail"
      ? { width: 1200, crop: "limit" }
      : { width: 640, crop: "fill" },
  );
}

function hoverUrl(images: ProductImage[]): string | undefined {
  const sorted = sortedImages(images);
  if (sorted.length < 2) return undefined;
  const hero = sorted.find((i) => i.isHero) ?? sorted[0];
  const alternate = sorted.find((i) => i.url !== hero?.url);
  return optimizeDeliveryUrl(alternate?.url, { width: 640, crop: "fill" });
}

function listPricing(variants: ProductVariant[]) {
  const active = variants.filter((v) => v.isActive && v.pricePkr > 0);
  if (!active.length) {
    return { fromPricePkr: 0, fromCompareAtPricePkr: null as number | null };
  }
  const cheapest = active.reduce((a, b) => (a.pricePkr <= b.pricePkr ? a : b));
  const compare = cheapest.compareAtPricePkr;
  return {
    fromPricePkr: cheapest.pricePkr,
    fromCompareAtPricePkr:
      compare != null && compare > cheapest.pricePkr ? compare : null,
  };
}

export async function listCategories() {
  const rows = await Category.findAll({ order: [["name", "ASC"]] });
  return rows.map((c) => ({ slug: c.slug, name: c.name }));
}

export async function listNoteTags() {
  const rows = await NoteTag.findAll({ order: [["name", "ASC"]] });
  return rows.map((t) => ({ slug: t.slug, name: t.name }));
}

export async function listProducts(query: {
  category?: string;
  note?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 24, 48);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {
    isPublished: true,
    deletedAt: null,
  };

  if (query.q) {
    Object.assign(where, {
      [Op.or]: [
        { title: { [Op.iLike]: `%${query.q}%` } },
        { designerInspiration: { [Op.iLike]: `%${query.q}%` } },
      ],
    });
  }

  const include = [
    {
      model: ProductVariant,
      as: "variants",
      where: { isActive: true },
      required: false,
    },
    {
      model: ProductImage,
      as: "images",
      required: false,
    },
    ...(query.category && query.category !== "all"
      ? [
          {
            model: Category,
            as: "categories",
            where: { slug: query.category },
            through: { attributes: [] },
            required: true,
          },
        ]
      : []),
    ...(query.note
      ? [
          {
            model: NoteTag,
            as: "noteTags",
            where: { slug: query.note },
            through: { attributes: [] },
            required: true,
          },
        ]
      : []),
  ];

  const { rows, count } = await Product.findAndCountAll({
    where,
    include,
    distinct: true,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  const items = rows.map((p) => {
    const variants = (p as Product & { variants?: ProductVariant[] }).variants ?? [];
    const images = (p as Product & { images?: ProductImage[] }).images ?? [];
    const pricing = listPricing(variants);
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      designerInspiration: p.designerInspiration,
      heroImageUrl: heroUrl(images, "card"),
      hoverImageUrl: hoverUrl(images),
      variants: variants.filter((v) => v.isActive).map(mapVariant),
      ...pricing,
    };
  });

  const summaryMap = await getReviewSummariesForProducts(items.map((i) => i.id));
  const itemsWithReviews = items.map((item) => ({
    ...item,
    reviewSummary: summaryMap.get(item.id) ?? null,
  }));

  return { items: itemsWithReviews, page, total: count };
}

export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({
    where: { slug, isPublished: true, deletedAt: null },
    include: [
      { model: ProductVariant, as: "variants" },
      { model: ProductImage, as: "images" },
      { model: Category, as: "categories", through: { attributes: [] } },
      { model: NoteTag, as: "noteTags", through: { attributes: [] } },
    ],
  });

  if (!product) return null;

  const reviewSummary = await getProductReviewSummary(product.id);

  const categories =
    (product as Product & { categories?: Category[] }).categories ?? [];
  const noteTags =
    (product as Product & { noteTags?: NoteTag[] }).noteTags ?? [];
  const variants = (product as Product & { variants?: ProductVariant[] }).variants ?? [];
  const images = (product as Product & { images?: ProductImage[] }).images ?? [];

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    designerInspiration: product.designerInspiration,
    heroImageUrl: heroUrl(images, "detail"),
    fromPricePkr: variants.length
      ? Math.min(...variants.map((v) => v.pricePkr))
      : 0,
    categories: categories.map((c) => c.slug),
    noteTags: noteTags.map((t) => t.slug),
    topNotes: product.topNotes,
    heartNotes: product.heartNotes,
    baseNotes: product.baseNotes,
    variants: variants.filter((v) => v.isActive).map(mapVariant),
    images: images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({
        url:
          optimizeDeliveryUrl(i.url, { width: 1200, crop: "limit" }) ?? i.url,
        isHero: i.isHero,
      })),
    reviewSummary,
  };
}
