import type { Express } from "express";
import adminRoute from "./adminRoute";
import analyticsRoute from "./analyticsRoute";
import authRoute from "./authRoute";
import cartRoute from "./cartRoute";
import catalogRoute from "./catalogRoute";
import checkoutRoute from "./checkoutRoute";
import healthRoute from "./healthRoute";
import sessionRoute from "./sessionRoute";

/** Mount all API routes (pern-alpha: app.js wires route modules). */
export function registerRoutes(app: Express) {
  app.use(healthRoute);
  app.use(sessionRoute);
  app.use(analyticsRoute);
  app.use(catalogRoute);
  app.use(cartRoute);
  app.use(checkoutRoute);
  app.use(authRoute);
  app.use(adminRoute);
}
