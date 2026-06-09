import { Router } from "express";
import {
  getMediaCapabilities,
  uploadProductImage,
} from "../controllers/media.controller";
import { productImageUpload } from "../middleware/upload";
import {
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminReview,
  getAdminOrder,
  patchAdminOrder,
  getAdminProduct,
  getAnalyticsOverview,
  getMetricsSummary,
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
router.patch("/admin/products/:id", catchAsync(patchAdminProduct));
router.delete("/admin/products/:id", catchAsync(deleteAdminProduct));
router.get("/admin/orders", catchAsync(listAdminOrders));
router.get("/admin/orders/:id", catchAsync(getAdminOrder));
router.patch("/admin/orders/:id", catchAsync(patchAdminOrder));
router.patch("/admin/orders/:id/status", catchAsync(patchOrderStatus));
router.get("/admin/reviews", catchAsync(listAdminReviews));
router.patch("/admin/reviews/:id", catchAsync(patchAdminReview));
router.delete("/admin/reviews/:id", catchAsync(deleteAdminReview));
router.post("/admin/reviews/import-shopify", catchAsync(importShopifyReviews));

export default router;
