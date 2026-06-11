import { Router } from "express";
import {
  createStreamToken,
  getUnreadCount,
  listNotifications,
  markNotificationsRead,
  streamNotifications,
} from "../controllers/notification.controller";
import { requireAuth } from "../middleware/requireAuth";
import { catchAsync } from "../utils/catchAsync";

const router = Router();

router.get("/admin/notifications/stream", catchAsync(streamNotifications));

router.use(requireAuth);
router.post("/admin/notifications/stream-token", catchAsync(createStreamToken));
router.get("/admin/notifications", catchAsync(listNotifications));
router.get("/admin/notifications/unread-count", catchAsync(getUnreadCount));
router.patch("/admin/notifications/read", catchAsync(markNotificationsRead));

export default router;
