"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminOrderDetail, AdminOrderRow as AdminOrderRowType } from "@/lib/api/admin";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/constants";
import { getValidAccessToken } from "@/lib/admin/token-storage";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { formatPkr } from "@/lib/format";
import { AdminOrderCustomerSummary } from "./AdminOrderCustomerSummary";
import { AdminOrderLineItemsTable } from "./AdminOrderLineItemsTable";
import { AdminOrderStatusBadge } from "./AdminOrderStatusBadge";
import {
  AdminOrderStatusActions,
  loadOrderDetail,
} from "./AdminOrderStatusActions";

type Props = {
  order: AdminOrderRowType;
  /** `list` = full orders page (with date). `dashboard` = recent orders widget. */
  variant?: "list" | "dashboard";
};

export function AdminOrderRow({ order: row, variant = "list" }: Props) {
  const isDashboard = variant === "dashboard";
  const cellPad = isDashboard ? "px-4 py-3" : "px-3 py-3";
  const colSpan = isDashboard ? 6 : 7;
  const { accessToken } = useAdminAuth();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function toggleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && !detail) {
      const token = getValidAccessToken() ?? accessToken;
      if (!token) return;
      setLoadingDetail(true);
      try {
        setDetail(await loadOrderDetail(token, row.id));
      } finally {
        setLoadingDetail(false);
      }
    }
  }

  function handleStatusUpdated(updated: AdminOrderDetail) {
    setDetail(updated);
  }

  const display = detail ?? null;

  return (
    <>
      <tr className="border-b border-lagari-border/60 hover:bg-lagari-elevated/20">
        <td className={`${cellPad} align-middle`}>
          <button
            type="button"
            onClick={() => void toggleExpand()}
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
          <Link
            href={`${ADMIN_ORDERS_PATH}/${row.id}`}
            className="text-sm font-medium text-lagari-brass hover:underline"
          >
            {isDashboard ? "View" : "View detail"}
          </Link>
        </td>
      </tr>
      <tr
        className={`bg-lagari-elevated/25 ${
          expanded ? "border-b border-lagari-border/60" : "border-0"
        }`}
        aria-hidden={!expanded}
      >
        <td colSpan={colSpan} className="p-0">
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:duration-0 ${
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div
                className={`${isDashboard ? "px-4" : "px-3 sm:px-4"} py-4 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
                  expanded ? "opacity-100" : "opacity-0"
                }`}
              >
                {loadingDetail ? (
                  <p className="py-8 text-center text-sm text-lagari-muted">
                    Loading order details…
                  </p>
                ) : display ? (
                  <div className="space-y-5 rounded-sm border border-lagari-border/70 bg-lagari-surface/80 p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-5 border-b border-lagari-border/50 pb-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <AdminOrderCustomerSummary
                          dense
                          name={display.customerName}
                          phone={display.customerPhone}
                          email={display.customerEmail}
                          city={display.shippingCity}
                          address={display.shippingAddress}
                        />
                      </div>
                      {display.allowedNextStatuses.length > 0 && (
                        <div className="shrink-0 lg:min-w-[160px] lg:text-right">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim">
                            Quick action
                          </p>
                          <AdminOrderStatusActions
                            orderId={row.id}
                            status={display.status}
                            allowedNextStatuses={display.allowedNextStatuses}
                            compact
                            onSuccess={handleStatusUpdated}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="mb-3 flex items-baseline justify-between gap-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim">
                          Line items
                        </h3>
                        <span className="text-xs text-lagari-muted">
                          {display.itemCount} piece{display.itemCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <AdminOrderLineItemsTable
                        compact
                        items={display.items}
                        subtotalPkr={display.subtotalPkr}
                        discountPkr={display.discountPkr}
                        totalPkr={display.totalPkr}
                      />
                    </div>

                    <div className="flex justify-end border-t border-lagari-border/40 pt-3">
                      <Link
                        href={`${ADMIN_ORDERS_PATH}/${row.id}`}
                        className="text-sm font-medium text-lagari-brass hover:underline"
                        tabIndex={expanded ? 0 : -1}
                      >
                        Open full order detail →
                      </Link>
                    </div>
                  </div>
                ) : expanded ? (
                  <p className="py-8 text-center text-sm text-lagari-muted">
                    Could not load order details.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
