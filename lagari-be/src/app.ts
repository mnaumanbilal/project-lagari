import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { requestId } from "./middleware/request-id";
import { registerRoutes } from "./routes";

/** Express app setup (pern-alpha: app.js — middleware + routes). */
export function createApp() {
  const app = express();

  app.use(requestId);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-Session-Id", "X-Request-Id"],
      exposedHeaders: ["X-Request-Id"],
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  registerRoutes(app);

  app.use(errorHandler);

  return app;
}
