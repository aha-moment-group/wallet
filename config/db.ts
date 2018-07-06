import { env } from "./env";

export const db =
  env === "production"
    ?{
      database: "your database name",
      dialect: "postgres",
      host: "your host",
      password: "your password",
      pool: {
        acquire: 30000,
        idle: 10000,
        max: 5,
        min: 0
      },
      port: 5432,
      user: "postgres"
    }
    : {
      database: "your dev database name",
      dialect: "postgres",
      host: "your host",
      password: "your password",
      port: 5432,
      user: "postgres"
    };
