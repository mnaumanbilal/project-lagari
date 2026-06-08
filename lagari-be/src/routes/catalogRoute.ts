import { Router } from "express";
import {
  getProductBySlug,
  getSiteConfig,
  listCategories,
  listNoteTags,
  listProductReviews,
  listProducts,
  submitProductReview,
} from "../controllers/catalog.controller";
import { catchAsync } from "../utils/catchAsync";

const router = Router();
router.get("/catalog/site-config", catchAsync(getSiteConfig));
router.get("/catalog/categories", catchAsync(listCategories));
router.get("/catalog/note-tags", catchAsync(listNoteTags));
router.get("/catalog/products", catchAsync(listProducts));
router.get("/catalog/products/:slug", catchAsync(getProductBySlug));
router.get("/catalog/products/:slug/reviews", catchAsync(listProductReviews));
router.post("/catalog/products/:slug/reviews", catchAsync(submitProductReview));
export default router;
