/** @param {string | undefined} databaseUrl */
function parseDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return null;
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}

module.exports = { parseDatabaseUrl };
