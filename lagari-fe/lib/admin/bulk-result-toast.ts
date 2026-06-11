"use client";

import type { AdminBulkActionResult } from "@/lib/api/admin";
import { useAdminToast } from "@/lib/admin/admin-toast-context";

export function toastBulkResult(
  toast: ReturnType<typeof useAdminToast>,
  result: AdminBulkActionResult,
  successLabel: string,
) {
  if (result.succeeded > 0 && result.failed.length === 0) {
    toast.success(`${successLabel} (${result.succeeded}).`);
  } else if (result.succeeded > 0) {
    toast.warning(
      `${successLabel}: ${result.succeeded} succeeded, ${result.failed.length} failed.`,
    );
  } else {
    toast.error(`Action failed for all ${result.failed.length} item(s).`);
  }
}
