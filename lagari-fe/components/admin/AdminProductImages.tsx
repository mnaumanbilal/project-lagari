"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { fetchMediaCapabilities, uploadProductImage } from "@/lib/api/media";
import { getValidAccessToken } from "@/lib/admin/token-storage";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import { getFieldError, hasFieldError, type FieldErrors } from "@/lib/admin/field-errors";
import { ApiError } from "@/lib/api/client";

export type ProductImageRow = {
  url: string;
  isHero: boolean;
  sortOrder: number;
};

type Props = {
  images: ProductImageRow[];
  onChange: (images: ProductImageRow[]) => void;
  errors?: FieldErrors;
};

export function AdminProductImages({ images, onChange, errors }: Props) {
  const { accessToken } = useAdminAuth();
  const toast = useAdminToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [canUpload, setCanUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const sectionError = getFieldError(errors ?? {}, "images");
  const sectionInvalid = hasFieldError(errors ?? {}, "images");

  useEffect(() => {
    const token = getValidAccessToken() ?? accessToken;
    if (!token) return;
    fetchMediaCapabilities(token)
      .then((c) => setCanUpload(c.cloudinaryUpload))
      .catch(() => setCanUpload(false));
  }, [accessToken]);

  function addUrl(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      toast.warning("Enter a valid image URL.");
      return;
    }
    const next = [
      ...images,
      { url: trimmed, isHero: images.length === 0, sortOrder: images.length },
    ];
    onChange(next.map((img, idx) => ({ ...img, sortOrder: idx })));
    setUrlInput("");
  }

  async function handleFiles(files: FileList | null) {
    const token = getValidAccessToken() ?? accessToken;
    if (!token || !files?.length) return;
    setUploading(true);
    try {
      let next = [...images];
      for (const file of Array.from(files)) {
        const { url } = await uploadProductImage(token, file);
        next = [
          ...next,
          { url, isHero: next.length === 0, sortOrder: next.length },
        ];
      }
      onChange(next.map((img, idx) => ({ ...img, sortOrder: idx })));
      toast.success(
        files.length > 1 ? `${files.length} images uploaded.` : "Image uploaded to Cloudinary.",
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Upload failed. Check Cloudinary env or paste a URL.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function setHero(index: number) {
    onChange(
      images.map((img, idx) => ({
        ...img,
        isHero: idx === index,
        sortOrder: idx,
      })),
    );
  }

  function remove(index: number) {
    const next = images.filter((_, i) => i !== index);
    if (next.length && !next.some((i) => i.isHero)) {
      next[0] = { ...next[0], isHero: true };
    }
    onChange(next.map((img, idx) => ({ ...img, sortOrder: idx })));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((img, idx) => ({ ...img, sortOrder: idx })));
  }

  return (
    <div
      data-admin-field="images"
      className={`space-y-3${sectionInvalid ? " admin-field-invalid" : ""}`}
    >
      <div>
        <h2 className="font-display text-lg font-semibold">Product images</h2>
        <p className="mt-1 text-xs text-lagari-muted">
          Images are stored on{" "}
          <strong className="font-medium text-lagari-primary">Cloudinary CDN</strong>
          ; the database only keeps URLs in <code className="text-lagari-brass">product_images</code>
          .
        </p>
      </div>

      {sectionError && (
        <p className="admin-field-error" role="alert">
          {sectionError}
        </p>
      )}

      <div className="admin-card flex flex-wrap items-center gap-2 p-3">
        {canUpload ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="admin-btn-primary px-4 py-2 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload image"}
            </button>
          </>
        ) : (
          <p className="text-xs text-lagari-muted">
            Set <code className="text-lagari-brass">CLOUDINARY_*</code> in lagari-be/.env to
            enable upload, or add URLs below.
          </p>
        )}
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://res.cloudinary.com/…"
            className="admin-input min-w-0 flex-1 px-3 py-2 text-sm"
          />
          <button
            type="button"
            className="admin-btn shrink-0 rounded-sm border border-lagari-border px-3 py-2"
            onClick={() => addUrl(urlInput)}
          >
            Add URL
          </button>
        </div>
      </div>

      {images.length > 0 && (
        <ul className="space-y-2">
          {images.map((img, idx) => {
            const rowError = getFieldError(errors ?? {}, `images.${idx}`);
            return (
            <li
              key={`${img.url}-${idx}`}
              className={`admin-card flex items-center gap-3 p-2${rowError ? " border-lagari-danger" : ""}`}
            >
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-lagari-deep">
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-lagari-muted">{img.url}</p>
                {rowError && (
                  <p className="admin-field-error mt-1" role="alert">
                    {rowError}
                  </p>
                )}
                {img.isHero && (
                  <span className="text-xs font-medium text-lagari-brass">Hero image</span>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  className="admin-btn text-xs"
                  onClick={() => setHero(idx)}
                >
                  {img.isHero ? "★ Hero" : "Set hero"}
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="admin-btn px-2 text-xs"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-btn px-2 text-xs"
                    onClick={() => move(idx, 1)}
                    disabled={idx === images.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-btn px-2 text-xs text-lagari-danger"
                    onClick={() => remove(idx)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          );
          })}
        </ul>
      )}
    </div>
  );
}
