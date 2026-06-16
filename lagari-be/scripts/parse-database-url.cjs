/** @param {string | undefined} databaseUrl */
function parseDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return null;
  const url = new URL(databaseUrl);
  const sslRequired =
    url.hostname.includes("neon.tech") ||
    url.searchParams.get("sslmode") === "require";
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    dialect: "postgres",
    dialectOptions: sslRequired
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
  };
}

module.exports = { parseDatabaseUrl };
