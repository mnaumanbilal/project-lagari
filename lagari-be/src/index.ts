import { createApp } from "./app";
import { PORT } from "./config/env";
import { connectDatabase } from "./db/models";
import { initNotificationPubSub } from "./lib/notification-pubsub";

/** Entry point (pern-alpha: app.js listens on PORT from env). */
async function main() {
  await connectDatabase();
  initNotificationPubSub();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`lagari-be listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
