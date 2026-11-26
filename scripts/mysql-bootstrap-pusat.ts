import "dotenv/config";
import { randomUUID } from "node:crypto";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { hashPassword } from "../src/db/password.server.ts";

/**
 * Membuat/ Memperbarui akun pusat dengan keanggotaan di SELURUH sekolah.
 * Akun pusat bersifat baca saja dan memakai dashboard gabungan lintas sekolah.
 */
const url = process.env.DATABASE_URL;
const email = process.env.ACCOUNT_EMAIL?.trim().toLowerCase();
const name = process.env.ACCOUNT_NAME?.trim();
const password = process.env.ACCOUNT_PASSWORD;
if (!url || !email || !name || !password)
  throw new Error("Isi DATABASE_URL, ACCOUNT_EMAIL, ACCOUNT_NAME, dan ACCOUNT_PASSWORD.");
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Email tidak valid.");

const passwordHash = await hashPassword(password);
const db = await mysql.createConnection(url);
try {
  await db.beginTransaction();
  const [users] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM app_users WHERE email=? FOR UPDATE",
    [email],
  );
  const userId = users[0]?.id ?? randomUUID();
  if (!users.length)
    await db.execute("INSERT INTO app_users (id,email,name,password_hash) VALUES (?,?,?,?)", [
      userId,
      email,
      name,
      passwordHash,
    ]);
  else if (process.env.ACCOUNT_ROTATE_PASSWORD === "yes") {
    await db.execute("UPDATE app_users SET name=?,password_hash=?,enabled=TRUE WHERE id=?", [
      name,
      passwordHash,
      userId,
    ]);
    await db.execute("DELETE FROM sessions WHERE user_id=?", [userId]);
  }
  const [schools] = await db.execute<RowDataPacket[]>("SELECT id FROM schools ORDER BY id");
  if (!schools.length) throw new Error("Belum ada sekolah terdaftar.");
  for (const school of schools)
    await db.execute(
      `INSERT INTO school_memberships (school_id,user_id,role,teacher_id,student_id,class_id)
       VALUES (?,?,'pusat',NULL,NULL,NULL)
       ON DUPLICATE KEY UPDATE role='pusat'`,
      [String(school["id"]), userId],
    );
  await db.commit();
  console.log(
    `Akun pusat ${email} aktif dengan akses baca pada ${schools.length} sekolah. ` +
      "Kata sandi lama tetap berlaku kecuali ACCOUNT_ROTATE_PASSWORD=yes.",
  );
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
