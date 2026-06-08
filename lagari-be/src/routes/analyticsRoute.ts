import { Router } from "express";
import {
  postAnalyticsBatch,
  postAnalyticsEvent,
} from "../controllers/analytics.controller";
import { analyticsRateLimit } from "../middleware/analyticsRateLimit";
import { catchAsync } from "../utils/catchAsync";

const router = Router();
router.post(
  "/analytics/events/batch",
  analyticsRateLimit,
  catchAsync(postAnalyticsBatch),
);
router.post(
  "/analytics/events",
  analyticsRateLimit,
  catchAsync(postAnalyticsEvent),
);
export default router;
