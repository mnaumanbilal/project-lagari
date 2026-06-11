"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminOrderRow as AdminOrderRowType } from "@/lib/api/admin";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/constants";
import { useAdminOrder } from "@/lib/admin/hooks/use-admin-queries";
import { formatPkr } from "@/lib/format";
import {
  AdminListCard,
  AdminListCardField,
  AdminListCardFields,
} from "./AdminListCard";
import { AdminOrderExpandPanel } from "./AdminOrderExpandPanel";
import { AdminOrderStatusBadge } from "./AdminOrderStatusBadge";
import { AdminRowActionsMenu } from "./AdminRowActionsMenu";

export type AdminOrderRowProps = {
  order: AdminOrderRowType;
  variant?: "list" | "dashboard";
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
};

function useOrderRowState(orderId: string) {
  const [expanded, setExpanded] = useState(false);
  const { data: detail, isLoading: loadingDetail } = useAdminOrder(
    expanded ? orderId : undefined,
  );
  return { expanded, setExpanded, detail, loadingDetail };
}

/** Desktop table rows — use inside `<tbody>`. */
export function AdminOrderTableRows({
  order: row,
  variant = "list",
  selectable = false,
  selected = false,
  onToggleSelect,
}: AdminOrderRowProps) {
  const isDashboard = variant === "dashboard";
  const cellPad = isDashboard ? "px-4 py-3" : "px-3 py-3";
  const colSpan = (isDashboard ? 6 : 7) + (selectable ? 1 : 0);
  const { expanded, setExpanded, detail, loadingDetail } = useOrderRowState(row.id);
  const display = detail ?? null;

  return (
    <>
      <tr className="border-b border-lagari-border/60 hover:bg-lagari-elevated/20">
        {selectable && (
          <td className={`${cellPad} align-middle`}>
            <input
              type="checkbox"
              aria-label={`Select order #${row.orderNumber}`}
              checked={selected}
              onChange={onToggleSelect}
              className="accent-lagari-brass"
            />
          </td>
        )}
        <td className={`${cellPad} align-middle`}>
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-lagari-muted transition-colors hover:bg-lagari-elevated hover:text-lagari-brass"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse order" : "Expand order"}
          >
            <span
              className={`inline-block text-[10px] transition-transform duration-300 ease-out motion-reduce:transition-none ${
                expanded ? "rotate-90" : ""
              }`}
              aria-hidden
            >
              ▶
            </span>
          </button>
        </td>
        <td className={`${cellPad} align-middle`}>
          <Link
            href={`${ADMIN_ORDERS_PATH}/${row.id}`}
            className="font-medium text-lagari-brass hover:underline"
          >
            #{row.orderNumber}
          </Link>
          {row.archivedAt ? (
            <span className="ml-2 rounded-sm bg-lagari-muted/20 px-1.5 py-0.5 text-[10px] uppercase text-lagari-muted">
              Archived
            </span>
          ) : null}
          <p className="mt-0.5 max-w-[220px] truncate text-xs text-lagari-muted">
            {row.itemPreview}
          </p>
        </td>
        <td className={`${cellPad} align-middle`}>
          <span className="font-medium">{row.customerName}</span>
          <span className="block text-xs text-lagari-muted">{row.customerPhone}</span>
        </td>
        <td className={`${cellPad} align-middle`}>
          <AdminOrderStatusBadge status={display?.status ?? row.status} />
        </td>
        {!isDashboard && (
          <td className={`${cellPad} align-middle text-lagari-muted`}>
            {new Date(row.createdAt).toLocaleString()}
          </td>
        )}
        <td className={`${cellPad} text-right align-middle font-medium tabular-nums`}>
          {formatPkr(row.totalPkr)}
        </td>
        <td className={`${cellPad} text-right align-middle`}>
          <AdminRowActionsMenu
            menuLabel={`Actions for order #${row.orderNumber}`}
            actions={[
              {
                label: isDashboard ? "View" : "View detail",
                href: `${ADMIN_ORDERS_PATH}/${row.id}`,
              },
            ]}
          />
        </td>
      </tr>
      <tr
        className={`bg-lagari-elevated/25 ${
          expanded ? "border-b border-lagari-border/60" : "border-0"
        }`}
        aria-hidden={!expanded}
      >
        <td colSpan={colSpan} className="p-0">
          <div className={`${isDashboard ? "px-4" : "px-3 sm:px-4"} py-4`}>
            <AdminOrderExpandPanel
              orderId={row.id}
              expanded={expanded}
              loading={loadingDetail}
              display={display}
            />
          </div>
        </td>
      </tr>
    </>
  );
}

/** Mobile card — use inside `<ul className="lg:hidden">`. */
export function AdminOrderCard({
  order: row,
  variant = "list",
  selectable = false,
  selected = false,
  onToggleSelect,
}: AdminOrderRowProps) {
  const isDashboard = variant === "dashboard";
  const { expanded, setExpanded, detail, loadingDetail } = useOrderRowState(row.id);
  const display = detail ?? null;

  return (
    <AdminListCard className="!p-3">
      <div className="flex items-start gap-2">
        {selectable ? (
          <input
            type="checkbox"
            aria-label={`Select order #${row.orderNumber}`}
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1 shrink-0 accent-lagari-brass"
          />
        ) : null}
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-lagari-muted transition-colors hover:bg-lagari-elevated hover:text-lagari-brass"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse order" : "Expand order"}
        >
          <span
            className={`inline-block text-[10px] transition-transform duration-300 ease-out motion-reduce:transition-none ${
              expanded ? "rotate-90" : ""
            }`}
            aria-hidden
          >
            ▶
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  href={`${ADMIN_ORDERS_PATH}/${row.id}`}
                  className="font-medium text-lagari-brass hover:underline"
                >
                  #{row.orderNumber}
                </Link>
                {row.archivedAt ? (
                  <span className="rounded-sm bg-lagari-muted/20 px-1.5 py-0.5 text-[10px] uppercase text-lagari-muted">
                    Archived
                  </span>
                ) : null}
                <AdminOrderStatusBadge status={display?.status ?? row.status} />
              </div>
              <p className="mt-1 line-clamp-2 break-words text-xs text-lagari-muted">
                {row.itemPreview}
              </p>
            </div>
            <AdminRowActionsMenu
              menuLabel={`Actions for order #${row.orderNumber}`}
              actions={[
                {
                  label: isDashboard ? "View" : "View detail",
                  href: `${ADMIN_ORDERS_PATH}/${row.id}`,
                },
              ]}
            />
          </div>
        </div>
      </div>

      <AdminListCardFields className="mt-2 grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-y-3">
        <AdminListCardField label="Customer" value={row.customerName} />
        <AdminListCardField label="Phone" value={row.customerPhone} />
        {!isDashboard ? (
          <AdminListCardField
            label="Date"
            value={new Date(row.createdAt).toLocaleString()}
            className="sm:col-span-2"
          />
        ) : null}
        <AdminListCardField
          label="Total"
          value={
            <span className="font-semibold tabular-nums">
              {formatPkr(row.totalPkr)}
            </span>
          }
        />
      </AdminListCardFields>

      <AdminOrderExpandPanel
        orderId={row.id}
        expanded={expanded}
        loading={loadingDetail}
        display={display}
      />
    </AdminListCard>
  );
}

/** @deprecated Use AdminOrderTableRows or AdminOrderCard explicitly. */
export function AdminOrderRow(props: AdminOrderRowProps) {
  return <AdminOrderTableRows {...props} />;
}
