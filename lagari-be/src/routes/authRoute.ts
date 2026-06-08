import { Router } from "express";
import { login, refreshToken } from "../controllers/auth.controller";
import { catchAsync } from "../utils/catchAsync";

const router = Router();
router.post("/auth/login", catchAsync(login));
router.post("/auth/refresh", catchAsync(refreshToken));
export default router;
