import { Sequelize } from "sequelize";
import { env } from "./env";

const { host, port, user, password, name, logging } = env.db;
const ssl = "ssl" in env.db ? env.db.ssl : false;

/** Sequelize instance — env-driven (see config/env.ts + .env). */
export const sequelize = new Sequelize({
  dialect: "postgres",
  host,
  port,
  username: user,
  password,
  database: name,
  logging: logging ? console.log : false,
  dialectOptions: ssl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : undefined,
  pool: {
    max: Number(process.env.DB_POOL_MAX ?? 20),
    min: 2,
    acquire: 30_000,
    idle: 10_000,
  },
  define: {
    underscored: true,
    timestamps: true,
  },
});
