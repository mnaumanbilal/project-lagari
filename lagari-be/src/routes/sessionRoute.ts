import { Router } from "express";
import {
  createAnalyticsSession,
  touchAnalyticsSession,
} from "../controllers/session.controller";
import { catchAsync } from "../utils/catchAsync";

const router = Router();
router.post("/sessions", catchAsync(createAnalyticsSession));
router.post("/sessions/:sessionId/touch", catchAsync(touchAnalyticsSession));
export default router;
