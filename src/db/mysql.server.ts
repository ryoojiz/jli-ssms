import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | undefined;

export function mysqlPool(): Pool {
  if (typeof window !== "undefined") throw new Error("Database hanya tersedia pada server.");
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL belum diatur untuk server MySQL.");
  pool ??= mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
    timezone: "Z",
  });
  return pool;
}

export function mysqlDb() {
  return drizzle({ client: mysqlPool() });
}
