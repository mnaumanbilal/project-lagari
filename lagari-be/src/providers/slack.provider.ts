import { env } from "../config/env";
import { withRetry } from "../utils/retry";

export async function sendSlackMessage(text: string): Promise<void> {
  const url = env.slackWebhookUrl.trim();
  if (!url) return;

  await withRetry(
    async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      // Surface transient 5xx so withRetry can decide to retry; 4xx (bad
      // webhook) carries a non-transient status and is not retried.
      if (!res.ok) {
        throw Object.assign(new Error(`Slack webhook responded ${res.status}`), {
          status: res.status,
        });
      }
    },
    { label: "slack.webhook" },
  );
}
