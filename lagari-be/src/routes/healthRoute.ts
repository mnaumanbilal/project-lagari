import { Router } from "express";
import { getEmailHealth, getHealth } from "../controllers/health.controller";
import { catchAsync } from "../utils/catchAsync";

const router = Router();
router.get("/health", catchAsync(getHealth));
router.get("/health/email", catchAsync(getEmailHealth));
export default router;
