"use client";

import Link from "next/link";
import type { AdminProduct } from "@/lib/api/admin";
import { formatPkr } from "@/lib/format";
import {
  AdminListCard,
  AdminListCardField,
  AdminListCardFields,
} from "./AdminListCard";
import { AdminRowActionsMenu } from "./AdminRowActionsMenu";

export type AdminProductRowProps = {
  product: AdminProduct;
  selected?: boolean;
  onToggleSelect?: () => void;
  onDelete: () => void;
};

export function AdminProductTableRow({
  product: p,
  selected = false,
  onToggleSelect,
  onDelete,
}: AdminProductRowProps) {
  return (
    <tr className="border-b border-lagari-border/60 last:border-0">
      <td className="px-3 py-3">
        <input
          type="checkbox"
          aria-label={`Select ${p.title}`}
          checked={selected}
          onChange={onToggleSelect}
          className="accent-lagari-brass"
        />
      </td>
      <td className="px-4 py-3">{p.title}</td>
      <td className="px-4 py-3 text-lagari-muted">{p.slug}</td>
      <td className="px-4 py-3">{p.isPublished ? "Yes" : "No"}</td>
      <td className="px-4 py-3">{formatPkr(p.fromPricePkr ?? 0)}</td>
      <td className="px-4 py-3 text-right">
        <AdminRowActionsMenu
          menuLabel={`Actions for ${p.title}`}
          actions={[
            {
              label: "Edit",
              href: `/admin-panel-route/products/${p.id}/edit`,
            },
            { label: "Delete", onClick: onDelete, variant: "destructive" },
          ]}
        />
      </td>
    </tr>
  );
}

export function AdminProductCard({
  product: p,
  selected = false,
  onToggleSelect,
  onDelete,
}: AdminProductRowProps) {
  return (
    <AdminListCard className="!p-3">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          aria-label={`Select ${p.title}`}
          checked={selected}
          onChange={onToggleSelect}
          className="mt-1 shrink-0 accent-lagari-brass"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-lagari-primary">{p.title}</p>
              <p className="mt-0.5 break-all text-xs text-lagari-muted">{p.slug}</p>
            </div>
            <AdminRowActionsMenu
              menuLabel={`Actions for ${p.title}`}
              actions={[
                {
                  label: "Edit",
                  href: `/admin-panel-route/products/${p.id}/edit`,
                },
                { label: "Delete", onClick: onDelete, variant: "destructive" },
              ]}
            />
          </div>
        </div>
      </div>
      <AdminListCardFields className="mt-2 grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-y-3">
        <AdminListCardField
          label="Published"
          value={p.isPublished ? "Yes" : "No"}
        />
        <AdminListCardField
          label="From"
          value={formatPkr(p.fromPricePkr ?? 0)}
        />
      </AdminListCardFields>
    </AdminListCard>
  );
}
