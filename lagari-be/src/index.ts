import type { Server } from "node:http";
import { createApp } from "./app";
import { PORT } from "./config/env";
import { connectDatabase } from "./db/models";
import { sequelize } from "./config/database";
import { initNotificationPubSub } from "./lib/notification-pubsub";
import { logger } from "./utils/logger";

/** Max time to wait for in-flight work before forcing exit. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

/** Close the HTTP server and DB pool, then exit. Safe to call once. */
async function gracefulShutdown(server: Server | null, code: number): Promise<void> {
  const timer = setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(code);
  }, SHUTDOWN_TIMEOUT_MS);
  timer.unref();

  try {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await sequelize.close();
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
  } finally {
    clearTimeout(timer);
    process.exit(code);
  }
}

/** Entry point (pern-alpha: app.js listens on PORT from env). */
async function main() {
  await connectDatabase();
  initNotificationPubSub();
  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info(`lagari-be listening on http://localhost:${PORT}`);
  });

  // Stray promise rejection: log loudly but keep serving — one bad async path
  // should not take down the whole API.
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled promise rejection");
  });

  // Uncaught exception leaves the process in an unknown state — drain and exit
  // so a supervisor (Railway/Render/PM2) can restart cleanly.
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception — shutting down");
    void gracefulShutdown(server, 1);
  });

  // Clean shutdown on deploy/restart signals.
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received — shutting down gracefully");
    void gracefulShutdown(server, 0);
  });
  process.on("SIGINT", () => {
    logger.info("SIGINT received — shutting down gracefully");
    void gracefulShutdown(server, 0);
  });
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
