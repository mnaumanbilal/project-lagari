import { Op } from "sequelize";
import {
  Category,
  NoteTag,
  Product,
  ProductImage,
  ProductVariant,
} from "../db/models";
import { AppError } from "../middleware/errorHandler";
import { sanitizeProductHtml } from "../utils/sanitizeHtml";
import { checkVariantLowStock } from "./inventory-alert.service";
import { notifyProductUpdated } from "./notification.service";

export type VariantInput = {
  id?: string;
  sku: string;
  name: string;
  pricePkr: number;
  compareAtPricePkr?: number | null;
  stock: number;
  lowStockThreshold?: number;
  isActive?: boolean;
};

export type ImageInput = {
  url: string;
  sortOrder?: number;
  isHero?: boolean;
};

export type ProductInput = {
  slug: string;
  title: string;
  description?: string | null;
  designerInspiration?: string | null;
  scentProfile?: "light" | "dark" | null;
  topNotes?: string | null;
  heartNotes?: string | null;
  baseNotes?: string | null;
  isPublished?: boolean;
  categorySlugs?: string[];
  noteTagSlugs?: string[];
  variants: VariantInput[];
  images?: ImageInput[];
};

async function resolveCategoryIds(slugs: string[]) {
  if (!slugs.length) return [];
  const rows = await Category.findAll({ where: { slug: { [Op.in]: slugs } } });
  if (rows.length !== slugs.length) {
    throw new AppError(400, "Unknown category slug");
  }
  return rows.map((c) => c.id);
}

async function resolveNoteTagIds(slugs: string[]) {
  if (!slugs.length) return [];
  const rows = await NoteTag.findAll({ where: { slug: { [Op.in]: slugs } } });
  if (rows.length !== slugs.length) {
    throw new AppError(400, "Unknown note tag slug");
  }
  return rows.map((t) => t.id);
}

function mapAdminProduct(product: Product) {
  const variants =
    (product as Product & { variants?: ProductVariant[] }).variants ?? [];
  const images =
    (product as Product & { images?: ProductImage[] }).images ?? [];
  const categories =
    (product as Product & { categories?: Category[] }).categories ?? [];
  const noteTags =
    (product as Product & { noteTags?: NoteTag[] }).noteTags ?? [];

  const pricing = variants.filter((v) => v.isActive && v.pricePkr > 0);
  const fromPricePkr = pricing.length
    ? Math.min(...pricing.map((v) => v.pricePkr))
    : 0;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    fromPricePkr,
    description: product.description,
    designerInspiration: product.designerInspiration,
    scentProfile: product.scentProfile,
    topNotes: product.topNotes,
    heartNotes: product.heartNotes,
    baseNotes: product.baseNotes,
    isPublished: product.isPublished,
    categories: categories.map((c) => c.slug),
    noteTags: noteTags.map((t) => t.slug),
    variants: variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      pricePkr: v.pricePkr,
      compareAtPricePkr: v.compareAtPricePkr,
      stock: v.stock,
      lowStockThreshold: v.lowStockThreshold,
      isActive: v.isActive,
      inStock: v.stock > 0 && v.isActive,
    })),
    images: [...images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({ url: i.url, isHero: i.isHero, sortOrder: i.sortOrder })),
    createdAt: product.createdAt,
  };
}

export async function getAdminProduct(id: string) {
  const product = await Product.findOne({
    where: { id, deletedAt: null },
    include: [
      { model: ProductVariant, as: "variants" },
      { model: ProductImage, as: "images" },
      { association: "categories" },
      { association: "noteTags" },
    ],
  });
  if (!product) throw new AppError(404, "Product not found");
  return mapAdminProduct(product);
}

export async function createProduct(input: ProductInput) {
  const existing = await Product.findOne({ where: { slug: input.slug } });
  if (existing) throw new AppError(409, "Slug already in use");

  const product = await Product.create({
    slug: input.slug,
    title: input.title,
    description: input.description
      ? sanitizeProductHtml(input.description)
      : null,
    designerInspiration: input.designerInspiration ?? null,
    scentProfile: input.scentProfile ?? null,
    topNotes: input.topNotes ?? null,
    heartNotes: input.heartNotes ?? null,
    baseNotes: input.baseNotes ?? null,
    catalogType: "fragrance",
    isPublished: input.isPublished ?? false,
    deletedAt: null,
  });

  const categoryIds = await resolveCategoryIds(input.categorySlugs ?? []);
  const noteTagIds = await resolveNoteTagIds(input.noteTagSlugs ?? []);
  if (categoryIds.length) {
    await (product as Product & { setCategories: (ids: string[]) => Promise<void> }).setCategories(
      categoryIds,
    );
  }
  if (noteTagIds.length) {
    await (product as Product & { setNoteTags: (ids: string[]) => Promise<void> }).setNoteTags(
      noteTagIds,
    );
  }

  for (const v of input.variants) {
    await ProductVariant.create({
      productId: product.id,
      sku: v.sku,
      name: v.name,
      pricePkr: v.pricePkr,
      compareAtPricePkr: v.compareAtPricePkr ?? null,
      stock: v.stock,
      lowStockThreshold: v.lowStockThreshold ?? 10,
      isActive: v.isActive ?? true,
    });
  }

  for (const [idx, img] of (input.images ?? []).entries()) {
    await ProductImage.create({
      productId: product.id,
      url: img.url,
      sortOrder: img.sortOrder ?? idx,
      isHero: img.isHero ?? idx === 0,
    });
  }

  return getAdminProduct(product.id);
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const product = await Product.findOne({ where: { id, deletedAt: null } });
  if (!product) throw new AppError(404, "Product not found");

  if (input.slug && input.slug !== product.slug) {
    const clash = await Product.findOne({ where: { slug: input.slug } });
    if (clash) throw new AppError(409, "Slug already in use");
  }

  await product.update({
    slug: input.slug ?? product.slug,
    title: input.title ?? product.title,
    description:
      input.description !== undefined
        ? input.description
          ? sanitizeProductHtml(input.description)
          : null
        : product.description,
    designerInspiration:
      input.designerInspiration !== undefined
        ? input.designerInspiration
        : product.designerInspiration,
    scentProfile:
      input.scentProfile !== undefined ? input.scentProfile : product.scentProfile,
    topNotes: input.topNotes !== undefined ? input.topNotes : product.topNotes,
    heartNotes:
      input.heartNotes !== undefined ? input.heartNotes : product.heartNotes,
    baseNotes: input.baseNotes !== undefined ? input.baseNotes : product.baseNotes,
    isPublished:
      input.isPublished !== undefined ? input.isPublished : product.isPublished,
  });

  if (input.categorySlugs) {
    const categoryIds = await resolveCategoryIds(input.categorySlugs);
    await (product as Product & { setCategories: (ids: string[]) => Promise<void> }).setCategories(
      categoryIds,
    );
  }
  if (input.noteTagSlugs) {
    const noteTagIds = await resolveNoteTagIds(input.noteTagSlugs);
    await (product as Product & { setNoteTags: (ids: string[]) => Promise<void> }).setNoteTags(
      noteTagIds,
    );
  }

  if (input.variants) {
    const existing = await ProductVariant.findAll({ where: { productId: id } });
    const keepIds = new Set(
      input.variants.map((v) => v.id).filter(Boolean) as string[],
    );
    for (const row of existing) {
      if (!keepIds.has(row.id)) await row.destroy();
    }
    for (const v of input.variants) {
      if (v.id) {
        const row = await ProductVariant.findByPk(v.id);
        if (row && row.productId === id) {
          await row.update({
            sku: v.sku,
            name: v.name,
            pricePkr: v.pricePkr,
            compareAtPricePkr: v.compareAtPricePkr ?? null,
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold ?? row.lowStockThreshold,
            isActive: v.isActive ?? row.isActive,
          });
        }
      } else {
        await ProductVariant.create({
          productId: id,
          sku: v.sku,
          name: v.name,
          pricePkr: v.pricePkr,
          compareAtPricePkr: v.compareAtPricePkr ?? null,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold ?? 10,
          isActive: v.isActive ?? true,
        });
      }
    }
  }

  if (input.images) {
    await ProductImage.destroy({ where: { productId: id } });
    for (const [idx, img] of input.images.entries()) {
      await ProductImage.create({
        productId: id,
        url: img.url,
        sortOrder: img.sortOrder ?? idx,
        isHero: img.isHero ?? idx === 0,
      });
    }
  }

  const updated = await getAdminProduct(id);

  void notifyProductUpdated({
    productId: id,
    title: updated.title,
    slug: updated.slug,
  }).catch((err) => console.error("product update notification failed:", err));

  if (input.variants) {
    for (const variant of updated.variants) {
      if (variant.isActive && variant.stock <= (variant.lowStockThreshold ?? 10)) {
        void checkVariantLowStock(variant.id).catch((err) =>
          console.error("low stock check failed:", err),
        );
      }
    }
  }

  return updated;
}

export async function softDeleteProduct(id: string) {
  const product = await Product.findOne({ where: { id, deletedAt: null } });
  if (!product) throw new AppError(404, "Product not found");
  await product.update({ deletedAt: new Date(), isPublished: false });
}

export type BulkActionResult = {
  succeeded: number;
  failed: Array<{ id: string; error: string }>;
};

export async function bulkSoftDeleteProducts(ids: string[]): Promise<BulkActionResult> {
  const result: BulkActionResult = { succeeded: 0, failed: [] };
  for (const id of ids) {
    try {
      await softDeleteProduct(id);
      result.succeeded += 1;
    } catch (err) {
      const message =
        err instanceof AppError ? err.message : "Could not delete product";
      result.failed.push({ id, error: message });
    }
  }
  return result;
}
