import { env } from "../config/env";

export async function sendSlackMessage(text: string): Promise<void> {
  const url = env.slackWebhookUrl.trim();
  if (!url) return;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}
