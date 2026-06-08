/**
 * Sequelize CLI config (pern-alpha: config/config.js + dotenv).
 * Supports DB_USERNAME (pern) or DB_USER (lagari).
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
const { parseDatabaseUrl } = require("../scripts/parse-database-url.cjs");

const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);

const base = fromUrl ?? {
  dialect: "postgres",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "lagari",
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
};

module.exports = {
  development: { ...base },
  test: {
    ...base,
    database: process.env.DB_NAME_TEST || "lagari_test",
  },
  production: fromUrl
    ? { ...base, logging: false }
    : {
        dialect: "postgres",
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER || process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        logging: false,
      },
};
