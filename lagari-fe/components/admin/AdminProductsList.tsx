"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAdminProducts, type AdminProduct } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";
import { formatPkr } from "@/lib/format";

export function AdminProductsList() {
  const { accessToken } = useAdminAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);

  useEffect(() => {
    const token = getValidAccessToken() ?? accessToken;
    if (!token) return;
    fetchAdminProducts(token).then(setProducts);
  }, [accessToken]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Products</h1>
        <Link
          href="/admin-panel-route/products/new"
          className="admin-btn-primary px-4 py-2"
        >
          New product
        </Link>
      </div>

      <div className="admin-card mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-lagari-border/60 last:border-0">
                <td className="px-4 py-3">{p.title}</td>
                <td className="px-4 py-3 text-lagari-muted">{p.slug}</td>
                <td className="px-4 py-3">{p.isPublished ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{formatPkr(p.fromPricePkr ?? 0)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin-panel-route/products/${p.id}/edit`}
                    className="text-lagari-brass hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
