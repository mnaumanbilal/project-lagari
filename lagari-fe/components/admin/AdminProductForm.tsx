"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton";
import { AdminTextField, AdminVariantField } from "@/components/admin/AdminField";
import { AdminTaxonomyCheckboxes } from "@/components/admin/AdminTaxonomyCheckboxes";
import { AdminProductImages, type ProductImageRow } from "@/components/admin/AdminProductImages";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { sanitizeProductHtml } from "@/lib/admin/sanitize-html";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import { ADMIN_PRODUCTS_PATH } from "@/lib/admin/constants";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import {
  useCreateAdminProduct,
  useDeleteAdminProduct,
  useUpdateAdminProduct,
} from "@/lib/admin/hooks/use-admin-mutations";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { useAdminProduct } from "@/lib/admin/hooks/use-admin-queries";
import { ApiError } from "@/lib/api/client";
import {
  applyFieldErrors,
  firstErrorMessage,
  getFieldError,
  hasFieldError,
  parseApiError,
  type FieldErrors,
} from "@/lib/admin/field-errors";
import {
  normalizeVariants,
  validateProductForm,
  type ProductVariantInput,
} from "@/lib/admin/product-form-validation";

type VariantRow = ProductVariantInput & { id?: string; compareAtPricePkr: number | null; isActive: boolean };

type Props = { productId?: string };

export function AdminProductForm({ productId }: Props) {
  const router = useRouter();
  const { error: toastError, success: toastSuccess, warning: toastWarning } =
    useAdminToast();
  const productQuery = useAdminProduct(productId);
  const createMutation = useCreateAdminProduct();
  const updateMutation = useUpdateAdminProduct(productId ?? "");
  const deleteMutation = useDeleteAdminProduct();
  const [hydrated, setHydrated] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [designerInspiration, setDesignerInspiration] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [noteTagSlugs, setNoteTagSlugs] = useState<string[]>([]);
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([
    { sku: "", name: "50ml", pricePkr: 0, compareAtPricePkr: null, stock: 0, isActive: true },
  ]);

  useEffect(() => {
    if (!productId) {
      setHydrated(true);
      return;
    }
    const p = productQuery.data;
    if (!p) return;

    setSlug(p.slug);
    setTitle(p.title);
    setDescription(p.description ?? "");
    setDesignerInspiration(p.designerInspiration ?? "");
    setIsPublished(!!p.isPublished);
    setCategorySlugs(p.categories ?? []);
    setNoteTagSlugs(p.noteTags ?? []);
    setImages(
      (p.images ?? []).map((i, idx) => ({
        url: i.url,
        isHero: i.isHero ?? idx === 0,
        sortOrder: i.sortOrder ?? idx,
      })),
    );
    setVariants(
      (p.variants ?? []).map((v) => ({
        id: v.id,
        sku: v.sku ?? "",
        name: v.name,
        pricePkr: v.pricePkr,
        compareAtPricePkr: v.compareAtPricePkr ?? null,
        stock: v.stock ?? 0,
        isActive: v.isActive !== false,
      })),
    );
    setFieldErrors({});
    setHydrated(true);
  }, [productId, productQuery.data]);

  useEffect(() => {
    if (productQuery.error) {
      const err = productQuery.error;
      const message =
        err instanceof ApiError ? err.message : "Could not load product.";
      toastError(message);
    }
  }, [productQuery.error, toastError]);

  function buildPayload() {
    const activeVariants = variants
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => row.sku.trim() || row.name.trim());
    const payloadImages = images.map((img, idx) => ({
      url: img.url,
      sortOrder: idx,
      isHero: img.isHero,
    }));

    return {
      slug: slug.trim(),
      title: title.trim(),
      description: description ? sanitizeProductHtml(description) : null,
      designerInspiration: designerInspiration || null,
      isPublished,
      categorySlugs,
      noteTagSlugs,
      variants: activeVariants.map(({ row }) => ({
        ...(row.id ? { id: row.id } : {}),
        sku: row.sku.trim(),
        name: row.name.trim(),
        pricePkr: Math.round(Number(row.pricePkr)),
        compareAtPricePkr: row.compareAtPricePkr,
        stock: Math.round(Number(row.stock)),
        isActive: row.isActive,
      })),
      images: payloadImages,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const clientErrors = validateProductForm({
      slug,
      title,
      description,
      designerInspiration,
      categorySlugs,
      noteTagSlugs,
      images,
      isPublished,
      variants,
    });

    if (Object.keys(clientErrors).length) {
      applyFieldErrors(clientErrors, setFieldErrors);
      toastWarning(
        firstErrorMessage(clientErrors) ??
          "Fix the highlighted fields before saving.",
      );
      return;
    }

    setFieldErrors({});

    try {
      const payload = buildPayload();
      if (productId) {
        await updateMutation.mutateAsync(payload);
        toastSuccess("Product updated.");
        router.push(ADMIN_PRODUCTS_PATH);
      } else {
        const created = await createMutation.mutateAsync(payload);
        toastSuccess("Product created.");
        router.push(`/admin-panel-route/products/${created.id}/edit`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const mapped = parseApiError(err);
        applyFieldErrors(mapped, setFieldErrors);
        if (err.status === 409) {
          toastWarning(err.message);
        } else {
          const detail = firstErrorMessage(mapped);
          toastError(
            detail && detail !== "Validation failed"
              ? detail
              : "Could not save — check highlighted fields.",
          );
        }
      } else {
        toastError("Could not save product. Try again.");
      }
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending;
  const loading = !!productId && (productQuery.isLoading || !hydrated);

  async function handleDeleteProduct() {
    if (!productId) return;
    try {
      await deleteMutation.mutateAsync(productId);
      toastSuccess(`"${title}" removed from the shop.`);
      router.push(ADMIN_PRODUCTS_PATH);
    } catch {
      toastError("Could not delete product.");
    } finally {
      setConfirmDelete(false);
    }
  }
  const variantsError = getFieldError(fieldErrors, "variants");
  const variantsInvalid = hasFieldError(fieldErrors, "variants");
  const visibleFieldErrors = Object.entries(fieldErrors).filter(
    ([key]) => key !== "_form",
  );

  if (loading) return <p className="text-lagari-muted">Loading…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={ADMIN_PRODUCTS_PATH}
          className="text-sm font-medium text-lagari-brass hover:underline"
        >
          ← Products
        </Link>
        {productId ? (
          <AdminRefreshButton queryKey={adminKeys.product(productId)} />
        ) : null}
      </div>
      <h1 className="font-display mt-4 text-3xl font-semibold">
        {productId ? "Edit product" : "New product"}
      </h1>

      <form onSubmit={handleSubmit} noValidate className="mt-8 max-w-2xl space-y-5">
        {(fieldErrors._form || visibleFieldErrors.length > 0) && (
          <div
            className="rounded-sm border border-lagari-danger/40 bg-lagari-surface px-3 py-2"
            role="alert"
          >
            {fieldErrors._form && (
              <p className="admin-field-error">{fieldErrors._form}</p>
            )}
            {visibleFieldErrors.length > 0 && (
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-lagari-danger">
                {visibleFieldErrors.map(([key, msg]) => (
                  <li key={key}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <AdminTextField
          label="Title"
          fieldKey="title"
          errors={fieldErrors}
          required
          value={title}
          onChange={setTitle}
        />
        <AdminTextField
          label="Slug"
          fieldKey="slug"
          errors={fieldErrors}
          required
          value={slug}
          onChange={setSlug}
          hint="Unique URL segment (e.g. desert-noir). Used on the storefront and must not duplicate another product."
        />
        <AdminTextField
          label="Designer inspiration"
          fieldKey="designerInspiration"
          errors={fieldErrors}
          value={designerInspiration}
          onChange={setDesignerInspiration}
        />
        <AdminRichTextEditor
          label="Description"
          fieldKey="description"
          errors={fieldErrors}
          value={description}
          onChange={setDescription}
        />
        <AdminTaxonomyCheckboxes
          kind="categories"
          label="Categories"
          fieldKey="categorySlugs"
          errors={fieldErrors}
          selected={categorySlugs}
          onChange={setCategorySlugs}
          hint="Choose where this product appears in shop filters (e.g. For Men, Unisex)."
        />
        <AdminTaxonomyCheckboxes
          kind="noteTags"
          label="Scent notes"
          fieldKey="noteTagSlugs"
          errors={fieldErrors}
          selected={noteTagSlugs}
          onChange={setNoteTagSlugs}
          hint="Note tags used for shop filtering and discovery."
        />
        <AdminProductImages
          images={images}
          onChange={setImages}
          errors={fieldErrors}
        />

        <div className="admin-card p-4" data-admin-field="isPublished">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mt-1 accent-lagari-brass"
            />
            <span>
              <span className="block text-sm font-medium text-lagari-primary">
                Visible on shop
              </span>
              <span className="mt-1 block text-xs text-lagari-muted">
                When enabled, this product appears on the public shop and product pages.
                When off, it stays in admin only (useful for drafts).
              </span>
            </span>
          </label>
        </div>

        <div
          data-admin-field="variants"
          className={variantsInvalid ? "admin-field-invalid" : undefined}
        >
          <h2 className="font-display text-lg font-semibold">Variants</h2>
          <p className="mt-1 text-xs text-lagari-muted">
            Each size or concentration is a variant with its own SKU, price, and stock.
            To put a variant on sale, set <strong className="text-lagari-primary">Sale price</strong> lower
            than <strong className="text-lagari-primary">Compare-at price</strong> (the original price).
          </p>
          {variantsError && (
            <p className="admin-field-error mt-2" role="alert">
              {variantsError}
            </p>
          )}
          {variants.map((v, idx) => (
            <div key={v.id ?? `variant-${idx}`} className="admin-card mt-3 p-3">
              <p className="mb-2 text-xs font-medium text-lagari-brass-dim">
                Variant {idx + 1}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
              <AdminVariantField
                label="SKU"
                fieldKey="sku"
                variantIndex={idx}
                errors={fieldErrors}
                inputProps={{
                  placeholder: "SKU",
                  value: v.sku,
                  onChange: (e) => {
                    const next = [...variants];
                    next[idx] = { ...v, sku: e.target.value };
                    setVariants(next);
                  },
                }}
              />
              <AdminVariantField
                label="Name"
                fieldKey="name"
                variantIndex={idx}
                errors={fieldErrors}
                inputProps={{
                  placeholder: "Name",
                  value: v.name,
                  onChange: (e) => {
                    const next = [...variants];
                    next[idx] = { ...v, name: e.target.value };
                    setVariants(next);
                  },
                }}
              />
              <AdminVariantField
                label="Sale price (PKR)"
                fieldKey="pricePkr"
                variantIndex={idx}
                errors={fieldErrors}
                inputProps={{
                  type: "number",
                  min: 0,
                  placeholder: "Current selling price",
                  value: v.pricePkr,
                  onChange: (e) => {
                    const next = [...variants];
                    next[idx] = { ...v, pricePkr: Number(e.target.value) };
                    setVariants(next);
                  },
                }}
              />
              <AdminVariantField
                label="Compare-at price (PKR)"
                fieldKey="compareAtPricePkr"
                variantIndex={idx}
                errors={fieldErrors}
                inputProps={{
                  type: "number",
                  min: 0,
                  placeholder: "Original price (optional)",
                  value: v.compareAtPricePkr ?? "",
                  onChange: (e) => {
                    const next = [...variants];
                    const raw = e.target.value;
                    next[idx] = {
                      ...v,
                      compareAtPricePkr: raw === "" ? null : Number(raw),
                    };
                    setVariants(next);
                  },
                }}
              />
              {v.compareAtPricePkr != null &&
              v.compareAtPricePkr > v.pricePkr &&
              v.pricePkr > 0 ? (
                <p className="sm:col-span-2 text-xs text-lagari-brass">
                  On sale —{" "}
                  {Math.round(
                    ((v.compareAtPricePkr - v.pricePkr) / v.compareAtPricePkr) * 100,
                  )}
                  % off ({v.compareAtPricePkr - v.pricePkr} PKR saved)
                </p>
              ) : null}
              <AdminVariantField
                label="Stock"
                fieldKey="stock"
                variantIndex={idx}
                errors={fieldErrors}
                inputProps={{
                  type: "number",
                  min: 0,
                  placeholder: "Stock",
                  value: v.stock,
                  onChange: (e) => {
                    const next = [...variants];
                    next[idx] = { ...v, stock: Number(e.target.value) };
                    setVariants(next);
                  },
                }}
              />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 text-sm font-medium text-lagari-brass hover:underline"
            onClick={() =>
              setVariants([
                ...variants,
                {
                  sku: "",
                  name: "",
                  pricePkr: 0,
                  compareAtPricePkr: null,
                  stock: 0,
                  isActive: true,
                },
              ])
            }
          >
            + Add variant
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="admin-btn-primary px-6 py-3 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save product"}
        </button>
      </form>

      {productId ? (
        <section className="admin-card mt-10 max-w-2xl border border-lagari-danger/30 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-lagari-danger">
            Danger zone
          </h2>
          <p className="mt-2 text-sm text-lagari-muted">
            Delete this product from the shop. It will be unpublished and hidden.
            Order history is kept.
          </p>
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={() => setConfirmDelete(true)}
            className="admin-btn mt-4 rounded-sm border border-lagari-danger/50 px-4 py-2 text-sm text-lagari-danger hover:bg-lagari-danger/10 disabled:opacity-50"
          >
            Delete product
          </button>
        </section>
      ) : null}

      <AdminConfirmDialog
        open={confirmDelete}
        title={`Delete "${title}"?`}
        description="Remove this product from the shop? It will be unpublished and hidden. Order history is kept."
        confirmLabel="Delete product"
        variant="destructive"
        busy={deleteMutation.isPending}
        onConfirm={() => void handleDeleteProduct()}
        onCancel={() => !deleteMutation.isPending && setConfirmDelete(false)}
      />
    </div>
  );
}
