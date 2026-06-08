import { Router } from "express";
import { placeCodCheckout } from "../controllers/checkout.controller";
import { requireSession } from "../middleware/requireSession";
import { catchAsync } from "../utils/catchAsync";

const router = Router();
router.post("/checkout/cod", requireSession, catchAsync(placeCodCheckout));
export default router;
