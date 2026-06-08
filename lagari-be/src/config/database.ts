import { Sequelize } from "sequelize";
import { env } from "./env";

const { host, port, user, password, name, logging } = env.db;

/** Sequelize instance — env-driven (see config/env.ts + .env). */
export const sequelize = new Sequelize({
  dialect: "postgres",
  host,
  port,
  username: user,
  password,
  database: name,
  logging: logging ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});
