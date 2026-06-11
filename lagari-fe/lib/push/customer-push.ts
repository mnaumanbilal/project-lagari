import { API_BASE_URL, USE_API } from "@/lib/api/config";

type PushConfig = {
  supported: boolean;
  publicKey: string | null;
};

let configCache: PushConfig | null = null;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function isBrowserPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function fetchPushConfig(): Promise<PushConfig> {
  if (configCache) return configCache;
  if (!USE_API) {
    configCache = { supported: false, publicKey: null };
    return configCache;
  }
  const res = await fetch(`${API_BASE_URL}/notifications/push/config`, {
    cache: "no-store",
  });
  if (!res.ok) {
    configCache = { supported: false, publicKey: null };
    return configCache;
  }
  configCache = (await res.json()) as PushConfig;
  return configCache;
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isBrowserPushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function subscribeToOrderPush(
  sessionId: string,
): Promise<"granted" | "denied" | "unsupported" | "error"> {
  if (!isBrowserPushSupported() || !USE_API) return "unsupported";

  const config = await fetchPushConfig();
  if (!config.supported || !config.publicKey) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const registration =
    (await navigator.serviceWorker.getRegistration("/")) ??
    (await registerPushServiceWorker());
  if (!registration) return "error";

  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        config.publicKey,
      ) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "error";

  const res = await fetch(`${API_BASE_URL}/notifications/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": sessionId,
    },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });

  return res.ok ? "granted" : "error";
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isBrowserPushSupported()) return "unsupported";
  return Notification.permission;
}
