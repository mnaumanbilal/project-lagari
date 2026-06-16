import { Router } from "express";
import {
  getMediaCapabilities,
  uploadProductImage,
} from "../controllers/media.controller";
import { productImageUpload } from "../middleware/upload";
import {
  bulkArchiveAdminOrders,
  bulkDeleteAdminProducts,
  bulkDeleteAdminReviews,
  bulkPatchAdminReviews,
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminReview,
  getAdminOrder,
  getReviewLinkedOrder,
  patchAdminOrder,
  patchAdminOrderArchive,
  getAdminProduct,
  getAnalyticsOverview,
  getMetricsSummary,
  getReviewAnalytics,
  importShopifyReviews,
  listAdminOrders,
  listAdminProducts,
  listAdminReviews,
  patchAdminProduct,
  patchAdminReview,
  patchOrderStatus,
} from "../controllers/admin.controller";
import { requireAuth } from "../middleware/requireAuth";
import { catchAsync } from "../utils/catchAsync";

const router = Router();
router.use(requireAuth);

router.get("/admin/metrics/summary", catchAsync(getMetricsSummary));
router.get("/admin/media/capabilities", catchAsync(getMediaCapabilities));
router.post(
  "/admin/media/upload",
  productImageUpload.single("file"),
  catchAsync(uploadProductImage),
);
router.get("/admin/analytics/overview", catchAsync(getAnalyticsOverview));
router.get("/admin/products", catchAsync(listAdminProducts));
router.get("/admin/products/:id", catchAsync(getAdminProduct));
router.post("/admin/products", catchAsync(createAdminProduct));
router.post("/admin/products/bulk-delete", catchAsync(bulkDeleteAdminProducts));
router.patch("/admin/products/:id", catchAsync(patchAdminProduct));
router.delete("/admin/products/:id", catchAsync(deleteAdminProduct));
router.get("/admin/orders", catchAsync(listAdminOrders));
router.get("/admin/orders/:id", catchAsync(getAdminOrder));
router.patch("/admin/orders/:id", catchAsync(patchAdminOrder));
router.patch("/admin/orders/:id/archive", catchAsync(patchAdminOrderArchive));
router.post("/admin/orders/bulk-archive", catchAsync(bulkArchiveAdminOrders));
router.patch("/admin/orders/:id/status", catchAsync(patchOrderStatus));
router.get("/admin/reviews", catchAsync(listAdminReviews));
router.get("/admin/reviews/analytics", catchAsync(getReviewAnalytics));
// :id routes must come after static sub-paths
router.get("/admin/reviews/:id/linked-order", catchAsync(getReviewLinkedOrder));
router.patch("/admin/reviews/:id", catchAsync(patchAdminReview));
router.delete("/admin/reviews/:id", catchAsync(deleteAdminReview));
router.post("/admin/reviews/bulk-delete", catchAsync(bulkDeleteAdminReviews));
router.post("/admin/reviews/bulk-patch", catchAsync(bulkPatchAdminReviews));
router.post("/admin/reviews/import-shopify", catchAsync(importShopifyReviews));

export default router;
