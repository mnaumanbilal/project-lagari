import { Router } from "express";
import {
  getCartHandler,
  removeCartItem,
  upsertCartItem,
} from "../controllers/cart.controller";
import { requireSession } from "../middleware/requireSession";
import { catchAsync } from "../utils/catchAsync";

const router = Router();
router.get("/cart", requireSession, catchAsync(getCartHandler));
router.post("/cart", requireSession, catchAsync(upsertCartItem));
router.delete(
  "/cart/items/:variantId",
  requireSession,
  catchAsync(removeCartItem),
);
export default router;
