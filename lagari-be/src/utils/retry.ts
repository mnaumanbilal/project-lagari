import { isTransientError } from "./error-taxonomy";
import { logger } from "./logger";

export type RetryOptions = {
  /** Total attempts including the first try (default 3). */
  maxAttempts?: number;
  /** Base backoff in ms; doubles each attempt (default 200). */
  baseDelayMs?: number;
  /** Upper bound for a single backoff delay (default 2000). */
  maxDelayMs?: number;
  /** Add randomness to avoid thundering herds (default true). */
  jitter?: boolean;
  /** Predicate deciding whether an error is retryable (default: transient only). */
  isRetryable?: (err: unknown) => boolean;
  /** Label used in retry logs. */
  label?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run `fn`, retrying ONLY transient failures with bounded exponential backoff
 * and jitter. Business/validation errors are never retried. The last error is
 * re-thrown once attempts are exhausted.
 *
 * Use this at infrastructure boundaries (external HTTP, email, DB reconnects).
 * Do NOT wrap non-idempotent writes (order/review creation) without a dedup key.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 200,
    maxDelayMs = 2000,
    jitter = true,
    isRetryable = isTransientError,
    label = "operation",
  } = options;

  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await fn();
    } catch (err) {
      const canRetry = attempt < maxAttempts && isRetryable(err);
      if (!canRetry) {
        if (attempt > 1) {
          logger.error({ err, label, attempts: attempt }, `Retry gave up: ${label}`);
        }
        throw err;
      }

      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const delay = jitter ? backoff / 2 + Math.random() * (backoff / 2) : backoff;
      logger.warn(
        { label, attempt, nextDelayMs: Math.round(delay) },
        `Transient failure, retrying: ${label}`,
      );
      await sleep(delay);
    }
  }
}
