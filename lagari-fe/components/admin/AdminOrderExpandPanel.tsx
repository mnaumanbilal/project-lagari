"use client";

import Link from "next/link";
import type { AdminOrderDetail } from "@/lib/api/admin";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/constants";
import { AdminOrderCustomerSummary } from "./AdminOrderCustomerSummary";
import { AdminOrderLineItemsTable } from "./AdminOrderLineItemsTable";
import { AdminOrderStatusActions } from "./AdminOrderStatusActions";

type Props = {
  orderId: string;
  expanded: boolean;
  loading: boolean;
  display: AdminOrderDetail | null;
};

export function AdminOrderExpandPanel({
  orderId,
  expanded,
  loading,
  display,
}: Props) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:duration-0 ${
        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className={`min-h-0 ${expanded ? "overflow-visible" : "overflow-hidden"}`}>
        <div
          className={`transition-opacity duration-300 ease-out motion-reduce:transition-none ${
            expanded ? "opacity-100" : "opacity-0"
          } ${expanded ? "pt-3" : ""}`}
        >
          {loading ? (
            <p className="py-6 text-center text-sm text-lagari-muted">
              Loading order details…
            </p>
          ) : display ? (
            <div className="space-y-4 rounded-sm border border-lagari-border/70 bg-lagari-surface/80 p-3 shadow-sm sm:space-y-5 sm:p-5">
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
                  <div className="shrink-0 lg:min-w-[160px]">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim lg:text-right">
                      Quick action
                    </p>
                    <div className="lg:flex lg:justify-end">
                      <AdminOrderStatusActions
                        orderId={orderId}
                        status={display.status}
                        allowedNextStatuses={display.allowedNextStatuses}
                        compact
                      />
                    </div>
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
                  href={`${ADMIN_ORDERS_PATH}/${orderId}`}
                  className="text-sm font-medium text-lagari-brass hover:underline"
                  tabIndex={expanded ? 0 : -1}
                >
                  Open full order detail →
                </Link>
              </div>
            </div>
          ) : expanded ? (
            <p className="py-6 text-center text-sm text-lagari-muted">
              Could not load order details.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
