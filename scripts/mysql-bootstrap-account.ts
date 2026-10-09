import "dotenv/config";
import { randomUUID } from "node:crypto";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { hashPassword } from "../src/db/password.server.ts";

const url = process.env.DATABASE_URL;
const email = process.env.ACCOUNT_EMAIL?.trim().toLowerCase();
const name = process.env.ACCOUNT_NAME?.trim();
const password = process.env.ACCOUNT_PASSWORD;
const schoolId = process.env.SCHOOL_ID?.trim();
const role = process.env.ACCOUNT_ROLE?.trim();
const validRoles = new Set([
  "kepala_sekolah",
  "operator",
  "guru",
  "wali_kelas",
  "bendahara",
  "pustakawan",
  "sarpras",
  "uks",
  "keamanan",
  "walimurid",
  "siswa",
  "auditor",
]);
if (!url || !email || !name || !password || !schoolId || !role)
  throw new Error(
    "Isi DATABASE_URL, ACCOUNT_EMAIL, ACCOUNT_NAME, ACCOUNT_PASSWORD, ACCOUNT_ROLE, SCHOOL_ID.",
  );
if (!validRoles.has(role) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
  throw new Error("Email atau peran tidak valid.");
if (["guru", "wali_kelas"].includes(role) && !process.env.TEACHER_ID)
  throw new Error("TEACHER_ID wajib untuk akun guru atau wali kelas.");
if (role === "wali_kelas" && !process.env.CLASS_ID)
  throw new Error("CLASS_ID wajib untuk akun wali kelas.");
if (["walimurid", "siswa"].includes(role) && !process.env.STUDENT_ID)
  throw new Error("STUDENT_ID wajib untuk akun wali murid atau siswa.");
const passwordHash = await hashPassword(password);
const db = await mysql.createConnection(url);
try {
  await db.beginTransaction();
  const [schools] = await db.execute<RowDataPacket[]>("SELECT id FROM schools WHERE id=?", [
    schoolId,
  ]);
  if (!schools.length) throw new Error(`Sekolah ${schoolId} belum terdaftar.`);
  for (const [table, id] of [
    ["teachers", process.env.TEACHER_ID],
    ["students", process.env.STUDENT_ID],
    ["classes", process.env.CLASS_ID],
  ] as const) {
    if (!id) continue;
    const [entities] = await db.execute<RowDataPacket[]>(
      `SELECT id FROM ${table} WHERE school_id=? AND id=?`,
      [schoolId, id],
    );
    if (!entities.length) throw new Error(`${table} ${id} tidak ditemukan di ${schoolId}.`);
  }
  if (role === "wali_kelas") {
    const [matches] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM classes WHERE school_id=? AND id=? AND homeroom_teacher_id=?",
      [schoolId, process.env.CLASS_ID, process.env.TEACHER_ID],
    );
    if (!matches.length) throw new Error("Guru belum terdaftar sebagai wali kelas tersebut.");
  }
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
    await db.execute("UPDATE app_users SET name=?, password_hash=? WHERE id=?", [
      name,
      passwordHash,
      userId,
    ]);
    await db.execute("DELETE FROM sessions WHERE user_id=?", [userId]);
  }
  await db.execute(
    "INSERT INTO school_memberships (school_id,user_id,role,teacher_id,student_id,class_id) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE role=VALUES(role),teacher_id=VALUES(teacher_id),student_id=VALUES(student_id),class_id=VALUES(class_id)",
    [
      schoolId,
      userId,
      role,
      process.env.TEACHER_ID || null,
      process.env.STUDENT_ID || null,
      process.env.CLASS_ID || null,
    ],
  );
  await db.execute("DELETE FROM parent_student_links WHERE school_id=? AND user_id=?", [
    schoolId,
    userId,
  ]);
  if (role === "walimurid" && process.env.STUDENT_ID)
    await db.execute(
      "INSERT IGNORE INTO parent_student_links (school_id,user_id,student_id) VALUES (?,?,?)",
      [schoolId, userId, process.env.STUDENT_ID],
    );
  await db.commit();
  console.log(
    `Keanggotaan ${email} di ${schoolId} disimpan. Kata sandi lama tetap berlaku kecuali ACCOUNT_ROTATE_PASSWORD=yes.`,
  );
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
