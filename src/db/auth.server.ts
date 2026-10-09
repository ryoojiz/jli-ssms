import { createHash, randomBytes } from "node:crypto";
import { deleteCookie, getCookie, getRequestUrl, setCookie } from "@tanstack/react-start/server";
import type { RowDataPacket } from "mysql2";
import { mysqlPool } from "./mysql.server";
import { verifyPassword } from "./password.server";
import type { Peran, Sesi } from "../lib/rbac";

const COOKIE = "jli_ssms_session";
const maxAge = 60 * 60 * 12;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

type Membership = RowDataPacket & {
  user_id: string;
  email: string;
  name: string;
  role: Peran;
  school_id: string;
  school_name: string;
  teacher_id: string | null;
  student_id: string | null;
  class_id: string | null;
  school_npsn: string | null;
  school_address: string | null;
  academic_year: string | null;
  semester: string | null;
};

async function membership(userId: string, schoolId: string) {
  const [rows] = await mysqlPool().execute<Membership[]>(
    `SELECT m.user_id,u.email,u.name,m.role,m.school_id,s.name AS school_name,
      s.npsn AS school_npsn,s.short_address AS school_address,
      s.academic_year,s.semester,
      m.teacher_id,m.student_id,m.class_id
     FROM school_memberships m JOIN app_users u ON u.id=m.user_id
     JOIN schools s ON s.id=m.school_id
     WHERE m.user_id=? AND m.school_id=? AND u.enabled=TRUE`,
    [userId, schoolId],
  );
  return rows[0];
}

async function profile(userId: string, schoolId: string): Promise<Sesi | null> {
  const m = await membership(userId, schoolId);
  if (!m) return null;
  const [schools] = await mysqlPool().execute<RowDataPacket[]>(
    `SELECT s.id,s.name FROM school_memberships m JOIN schools s ON s.id=m.school_id
     WHERE m.user_id=? ORDER BY s.name`,
    [userId],
  );
  return {
    nama: m.name,
    email: m.email,
    peran: m.role,
    schoolId: m.school_id,
    schoolName: m.school_name,
    ...(m.school_npsn ? { schoolNpsn: m.school_npsn } : {}),
    ...(m.school_address ? { schoolAddress: m.school_address } : {}),
    ...(m.academic_year ? { academicYear: m.academic_year } : {}),
    ...(m.semester ? { semester: m.semester } : {}),
    schools: schools.map((s) => ({ id: String(s["id"]), name: String(s["name"]) })),
    ...(m.teacher_id ? { guruId: m.teacher_id } : {}),
    ...(m.student_id ? { siswaId: m.student_id } : {}),
    ...(m.class_id ? { classId: m.class_id } : {}),
    ...(m.class_id ? { konteks: `Kelas ${m.class_id.replace(/^K/, "")}` } : {}),
  };
}

export async function currentIdentity(): Promise<{
  userId: string;
  sessionHash: string;
  sesi: Sesi;
} | null> {
  const token = getCookie(COOKIE);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const sessionHash = digest(token);
  const [rows] = await mysqlPool().execute<RowDataPacket[]>(
    "SELECT user_id,active_school_id FROM sessions WHERE token_hash=? AND expires_at > NOW(3)",
    [sessionHash],
  );
  const row = rows[0];
  if (!row) return null;
  const sesi = await profile(String(row["user_id"]), String(row["active_school_id"]));
  return sesi ? { userId: String(row["user_id"]), sessionHash, sesi } : null;
}

export async function requireIdentity(roles?: readonly Peran[]) {
  const identity = await currentIdentity();
  if (!identity) throw new Error("Sesi tidak berlaku. Silakan masuk kembali.");
  if (roles && !roles.includes(identity.sesi.peran))
    throw new Error("Anda tidak berwenang melakukan tindakan ini.");
  return identity;
}

export async function signIn(email: string, password: string): Promise<Sesi | null> {
  const [users] = await mysqlPool().execute<RowDataPacket[]>(
    "SELECT id,password_hash FROM app_users WHERE email=? AND enabled=TRUE",
    [email.trim().toLowerCase()],
  );
  const user = users[0];
  if (!user || !(await verifyPassword(password, String(user["password_hash"])))) return null;
  const [memberships] = await mysqlPool().execute<RowDataPacket[]>(
    "SELECT school_id FROM school_memberships WHERE user_id=? ORDER BY school_id LIMIT 1",
    [user["id"]],
  );
  const schoolId = memberships[0]?.["school_id"];
  if (!schoolId) return null;
  const sesi = await profile(String(user["id"]), String(schoolId));
  if (!sesi) return null;
  const token = randomBytes(32).toString("hex");
  await mysqlPool().execute(
    "INSERT INTO sessions (token_hash,user_id,active_school_id,expires_at) VALUES (?,?,?,DATE_ADD(NOW(3),INTERVAL 12 HOUR))",
    [digest(token), user["id"], schoolId],
  );
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: getRequestUrl().protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return sesi;
}

export async function switchSchool(schoolId: string): Promise<Sesi> {
  const identity = await requireIdentity();
  const next = await profile(identity.userId, schoolId);
  if (!next) throw new Error("Anda bukan anggota sekolah tersebut.");
  await mysqlPool().execute("UPDATE sessions SET active_school_id=? WHERE token_hash=?", [
    schoolId,
    identity.sessionHash,
  ]);
  return next;
}

export async function signOut() {
  const token = getCookie(COOKIE);
  if (token) await mysqlPool().execute("DELETE FROM sessions WHERE token_hash=?", [digest(token)]);
  deleteCookie(COOKIE, { path: "/" });
}
