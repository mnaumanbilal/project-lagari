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
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    name: parsed.pathname.replace(/^\//, ""),
  };
}

function resolveDb() {
  if (process.env.DATABASE_URL) {
    return {
      ...parseDatabaseUrl(process.env.DATABASE_URL),
      logging: process.env.DB_LOGGING === "true",
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
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
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
};

export function isCloudinaryConfigured(): boolean {
  const c = env.cloudinary;
  return Boolean(c.cloudName && c.apiKey && c.apiSecret);
}

export const PORT = env.port;
