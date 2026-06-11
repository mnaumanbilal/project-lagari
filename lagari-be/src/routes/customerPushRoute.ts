import { Router } from "express";
import {
  getPushConfig,
  subscribePush,
  unsubscribePush,
} from "../controllers/customer-push.controller";
import { requireSession } from "../middleware/requireSession";
import { catchAsync } from "../utils/catchAsync";

const router = Router();

router.get("/notifications/push/config", catchAsync(getPushConfig));
router.post(
  "/notifications/push/subscribe",
  requireSession,
  catchAsync(subscribePush),
);
router.post(
  "/notifications/push/unsubscribe",
  requireSession,
  catchAsync(unsubscribePush),
);

export default router;
