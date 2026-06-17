import pino from "pino";

// Pretty output only for local development. Production and test use plain JSON
// (the pretty transport spawns a worker thread, which we avoid under tests).
const usePretty =
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";

/**
 * Single shared pino logger.
 *
 * - Dev: pretty, colorised, human-readable output.
 * - Production / test: structured JSON (one line per event) for log aggregators.
 *
 * Attach a `requestId` to error logs so a user-facing failure can be traced
 * back to a specific request (see `middleware/request-id.ts`).
 */
export const logger = pino(
  usePretty
    ? {
        level: process.env.LOG_LEVEL ?? "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : { level: process.env.LOG_LEVEL ?? "info" },
);
