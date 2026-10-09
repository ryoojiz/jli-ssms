import "dotenv/config";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL wajib diisi sebelum migrasi MySQL.");
const connection = await mysql.createConnection({ uri: url, multipleStatements: false });
const directory = join(process.cwd(), "database", "mysql", "migrations");
const lockName = "jli_ssms_mysql_migrations";

async function applyStatement(statement: string) {
  const alter = /^ALTER TABLE (\w+) (.+)$/is.exec(statement);
  if (alter) {
    const table = alter[1]!;
    const columns = [...alter[2]!.matchAll(/ADD COLUMN (\w+)/gi)].map((match) => match[1]!);
    if (columns.length) {
      const [existing] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?`,
        [table],
      );
      const present = new Set(existing.map((row) => String(row["COLUMN_NAME"])));
      if (columns.every((column) => present.has(column))) return;
      if (columns.some((column) => present.has(column)))
        throw new Error(`Migrasi sebagian pada ${table}; periksa kolom ${columns.join(", ")}.`);
    }
  }
  await connection.query(statement);
}

try {
  const [lockRows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT GET_LOCK(?, 30) AS acquired",
    [lockName],
  );
  if (lockRows[0]?.acquired !== 1) throw new Error("Migrasi sedang dijalankan proses lain.");
  await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename VARCHAR(160) PRIMARY KEY, checksum CHAR(64) NOT NULL,
    applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  for (const filename of (await readdir(directory))
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const source = await readFile(join(directory, filename), "utf8");
    const checksum = createHash("sha256").update(source).digest("hex");
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT checksum FROM schema_migrations WHERE filename = ?",
      [filename],
    );
    if (rows.length) {
      if (rows[0]?.checksum !== checksum)
        throw new Error(`Migrasi ${filename} berubah setelah diterapkan.`);
      console.log(`Lewati ${filename}`);
      continue;
    }
    // Migration files contain DDL only; no procedures or semicolons inside values.
    const statements = source
      .split(/;\s*(?:\r?\n|$)/)
      .map((part) => part.replace(/^\s*(?:--[^\n]*\r?\n\s*)+/, "").trim())
      .filter(Boolean);
    for (const statement of statements) await applyStatement(statement);
    await connection.execute("INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)", [
      filename,
      checksum,
    ]);
    console.log(`Terapkan ${filename} (${statements.length} perintah)`);
  }
} finally {
  await connection.query("SELECT RELEASE_LOCK(?)", [lockName]).catch(() => undefined);
  await connection.end();
}
