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
  const allowedOrigins = new Set(env.corsOrigins);

  app.use(requestId);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow server-to-server and health-check requests with no Origin header.
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.has(normalizedOrigin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Session-Id",
        "X-Request-Id",
        "Idempotency-Key",
      ],
      exposedHeaders: ["X-Request-Id"],
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  registerRoutes(app);

  app.use(errorHandler);

  return app;
}
