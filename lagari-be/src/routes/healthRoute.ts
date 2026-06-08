import { Router } from "express";
import { getHealth } from "../controllers/health.controller";
import { catchAsync } from "../utils/catchAsync";

const router = Router();
router.get("/health", catchAsync(getHealth));
export default router;
