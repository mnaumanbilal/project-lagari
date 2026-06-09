import { orderStatusLabel, statusBadgeClass } from "@/lib/admin/order-status";

export function AdminOrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(status)}`}
    >
      {orderStatusLabel(status)}
    </span>
  );
}
