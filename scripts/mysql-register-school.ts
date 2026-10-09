import "dotenv/config";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
const id = process.env.SCHOOL_ID?.trim();
const name = process.env.SCHOOL_NAME?.trim();
const npsn = process.env.SCHOOL_NPSN?.trim() || null;
if (!url || !id || !name) throw new Error("Isi DATABASE_URL, SCHOOL_ID, dan SCHOOL_NAME.");
if (!/^[A-Za-z0-9-]{2,32}$/.test(id) || name.length > 160)
  throw new Error("ID atau nama sekolah tidak valid.");
const db = await mysql.createConnection(url);
try {
  await db.execute(
    "INSERT INTO schools (id, name, npsn) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), npsn=VALUES(npsn)",
    [id, name, npsn],
  );
  console.log(`Sekolah ${id} terdaftar.`);
} finally {
  await db.end();
}
