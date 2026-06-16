import { Suspense } from "react";
import { AdminReviews } from "@/components/admin/AdminReviews";

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<p className="text-lagari-muted">Loading reviews…</p>}>
      <AdminReviews />
    </Suspense>
  );
}
