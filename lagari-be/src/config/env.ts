import dotenv from "dotenv";
import path from "path";

// Load .env from project root (same pattern as pern-alpha config/config.js)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  const sslRequired =
    parsed.hostname.includes("neon.tech") ||
    parsed.searchParams.get("sslmode") === "require";
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    name: parsed.pathname.replace(/^\//, ""),
    ssl: sslRequired,
  };
}

function resolveDb() {
  if (process.env.DATABASE_URL) {
    return {
      ...parseDatabaseUrl(process.env.DATABASE_URL),
      logging: process.env.DB_LOGGING === "true",
      ssl:
        process.env.DATABASE_URL.includes("neon.tech") ||
        process.env.DATABASE_URL.includes("sslmode=require"),
    };
  }

  const password = process.env.DB_PASSWORD ?? "";
  if (!password) {
    throw new Error(
      "DB_PASSWORD is not set. Edit lagari-be/.env or run: npm run setup:env",
    );
  }

  return {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? process.env.DB_USERNAME ?? "postgres",
    password,
    name: process.env.DB_NAME ?? "lagari",
    logging: process.env.DB_LOGGING === "true",
  };
}

/** Central env — PORT, DB, JWT, CORS (pern-alpha: dotenv + constantSettings). */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
  db: resolveDb(),
  redisUrl: process.env.REDIS_URL ?? "",
  jwt: {
    accessSecret: required(
      "JWT_ACCESS_SECRET",
      "dev-lagari-access-secret-min-32-chars-long",
    ),
    refreshSecret: required(
      "JWT_REFRESH_SECRET",
      "dev-lagari-refresh-secret-min-32-chars-long",
    ),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin",
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? "admin",
  },
  sessionIdleMinutes: 30,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    folder: process.env.CLOUDINARY_FOLDER ?? "lagari/products",
  },
  email: {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    appPassword: process.env.SMTP_APP_PASSWORD ?? "",
    from: process.env.EMAIL_FROM ?? "Lagari <noreply@lagari.pk>",
    adminTo: process.env.ADMIN_EMAIL ?? "",
    /** Customer reply target — defaults to ADMIN_EMAIL when unset. */
    replyTo: process.env.REPLY_TO_EMAIL ?? process.env.ADMIN_EMAIL ?? "",
  },
  /** HTTPS email API — use on Render (SMTP ports blocked on free tier). */
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from:
      process.env.RESEND_FROM ??
      process.env.EMAIL_FROM ??
      "Lagari <onboarding@resend.dev>",
  },
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL ?? "",
  /** Primary site domain for admin links (e.g. https://www.lagari.pk) */
  domain: (
    process.env.DOMAIN ??
    process.env.PUBLIC_SITE_URL ??
    "https://www.lagari.pk"
  ).replace(/\/$/, ""),
  storefrontUrl:
    process.env.STOREFRONT_URL ??
    (process.env.CORS_ORIGIN ?? "http://localhost:3000")
      .split(",")[0]
      ?.trim()
      .replace(/\/$/, "") ??
    "http://localhost:3000",
  publicSiteUrl: process.env.PUBLIC_SITE_URL ?? "https://www.lagari.pk",
  webPush: {
    publicKey: process.env.VAPID_PUBLIC_KEY ?? "",
    privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
    subject: process.env.VAPID_SUBJECT ?? "mailto:lagariassistant@gmail.com",
  },
};

export function isCloudinaryConfigured(): boolean {
  const c = env.cloudinary;
  return Boolean(c.cloudName && c.apiKey && c.apiSecret);
}

export function isResendConfigured(): boolean {
  const r = env.resend;
  return Boolean(r.apiKey && r.from);
}

export function isSmtpConfigured(): boolean {
  const e = env.email;
  return Boolean(e.user && e.appPassword);
}

/** Active outbound email transport (Resend preferred over SMTP). */
export function getEmailProvider(): "resend" | "smtp" | "none" {
  if (isResendConfigured()) return "resend";
  if (isSmtpConfigured()) return "smtp";
  return "none";
}

export function isEmailDeliveryConfigured(): boolean {
  return getEmailProvider() !== "none";
}

export function isEmailConfigured(): boolean {
  return Boolean(env.email.adminTo) && isEmailDeliveryConfigured();
}

export function isWebPushConfigured(): boolean {
  const w = env.webPush;
  return Boolean(w.publicKey && w.privateKey);
}

export const PORT = env.port;
