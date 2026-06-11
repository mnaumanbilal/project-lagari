import type { FieldErrors } from "./field-errors";
import type { ProductImageRow } from "@/components/admin/AdminProductImages";

export type ProductVariantInput = {
  sku: string;
  name: string;
  pricePkr: number;
  compareAtPricePkr?: number | null;
  stock: number;
};

export type ProductFormValues = {
  slug: string;
  title: string;
  description: string;
  designerInspiration: string;
  categorySlugs: string[];
  noteTagSlugs: string[];
  images: ProductImageRow[];
  isPublished: boolean;
  variants: ProductVariantInput[];
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeVariants(
  variants: ProductVariantInput[],
): ProductVariantInput[] {
  return variants.filter((v) => v.sku.trim() || v.name.trim());
}

export function validateProductForm(values: ProductFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }

  const slug = values.slug.trim();
  if (!slug) {
    errors.slug = "Slug is required.";
  } else if (!SLUG_RE.test(slug)) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only (e.g. desert-noir).";
  }

  const indexed = values.variants
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => row.sku.trim() || row.name.trim());

  if (!indexed.length) {
    errors.variants = "Add at least one variant with SKU and name.";
  } else {
    indexed.forEach(({ row: v, idx }) => {
      if (!v.sku.trim()) {
        errors[`variants.${idx}.sku`] = "SKU is required.";
      }
      if (!v.name.trim()) {
        errors[`variants.${idx}.name`] = "Variant name is required.";
      }
      if (v.pricePkr < 0 || Number.isNaN(v.pricePkr)) {
        errors[`variants.${idx}.pricePkr`] = "Enter a valid price.";
      } else if (!Number.isInteger(v.pricePkr)) {
        errors[`variants.${idx}.pricePkr`] = "Price must be a whole number (PKR).";
      }
      const compare = v.compareAtPricePkr;
      if (compare != null) {
        if (compare < 0 || Number.isNaN(compare)) {
          errors[`variants.${idx}.compareAtPricePkr`] = "Enter a valid compare-at price.";
        } else if (!Number.isInteger(compare)) {
          errors[`variants.${idx}.compareAtPricePkr`] =
            "Compare-at price must be a whole number (PKR).";
        } else if (compare <= v.pricePkr) {
          errors[`variants.${idx}.compareAtPricePkr`] =
            "Compare-at price must be higher than the sale price.";
        }
      }
      if (v.stock < 0 || Number.isNaN(v.stock)) {
        errors[`variants.${idx}.stock`] = "Stock cannot be negative.";
      }
    });
  }

  values.images.forEach((img, idx) => {
    const url = img.url.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      errors[`images.${idx}`] = "Enter a valid image URL.";
      if (!errors.images) {
        errors.images = `Image ${idx + 1} has an invalid URL.`;
      }
    }
  });

  return errors;
}
