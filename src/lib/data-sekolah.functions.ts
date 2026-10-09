import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";

const classKey = (value: string) =>
  value.toUpperCase().startsWith("K") ? value.toUpperCase() : `K${value.toUpperCase()}`;
const studentKey = (nisn: string) => `DB-${nisn}`;

const teks = (max = 200) => z.string().trim().max(max).nullable().optional();

const GuruSchema = z.object({
  nip: z.string().trim().min(1).max(40),
  nama: z.string().trim().min(1).max(150),
  jenis_kelamin: teks(2),
  jabatan: teks(),
  mapel: teks(),
  wali_kelas: teks(10),
  telp: teks(30),
  email: teks(150),
  status: teks(20),
});
const KelasSchema = z.object({
  id: z.string().trim().min(1).max(10),
  tingkat: z.number().int().min(1).max(12),
  rombel: teks(5),
  nip_wali: teks(40),
  ruang: teks(30),
  kapasitas: z.number().int().min(0).max(100).nullable().optional(),
});
const SiswaSchema = z.object({
  nisn: z.string().trim().min(1).max(20),
  nis: teks(20),
  nama: z.string().trim().min(1).max(150),
  jenis_kelamin: teks(2),
  tanggal_lahir: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  kelas_id: z.string().trim().min(1).max(10),
  alamat: teks(300),
  nama_ayah: teks(150),
  nama_ibu: teks(150),
  nama_wali: teks(150),
  telp_wali: teks(30),
  email_wali: teks(150),
});
const HadirSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nisn: z.string().trim().min(1).max(20),
  kelas_id: z.string().trim().min(1).max(10),
  status: z.enum(["Hadir", "Terlambat", "Izin", "Sakit", "Alfa"]),
  keterangan: teks(300),
});

const ImporSchema = z.object({
  guru: z.array(GuruSchema).max(500),
  kelas: z.array(KelasSchema).max(200),
  siswa: z.array(SiswaSchema).max(3000),
  kehadiran: z.array(HadirSchema).max(20000),
});
export type DataImpor = z.infer<typeof ImporSchema>;

export const imporDataSekolah = createServerFn({ method: "POST" })
  .inputValidator((d) => ImporSchema.parse(d))
  .handler(async ({ data }) => {
    const { requireIdentity } = await import("@/db/auth.server");
    const { mysqlPool } = await import("@/db/mysql.server");
    const { appendAudit } = await import("@/db/audit.server");
    const { sesi } = await requireIdentity(["operator"]);
    const schoolId = sesi.schoolId!;
    const db = await mysqlPool().getConnection();
    const hasil = { guru: 0, kelas: 0, siswa: 0, kehadiran: 0 };
    try {
      await db.beginTransaction();
      for (const g of data.guru) {
        await db.execute(
          `INSERT INTO teachers (school_id,id,nip,name,sex,position,subject,homeroom_class,phone,email,employment_status)
           VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),sex=VALUES(sex),position=VALUES(position),subject=VALUES(subject),homeroom_class=VALUES(homeroom_class),phone=VALUES(phone),email=VALUES(email),employment_status=VALUES(employment_status)`,
          [
            schoolId,
            `DB-${g.nip}`,
            g.nip,
            g.nama,
            g.jenis_kelamin ?? null,
            g.jabatan ?? null,
            g.mapel ?? null,
            g.wali_kelas ?? null,
            g.telp ?? null,
            g.email ?? null,
            g.status ?? null,
          ],
        );
      }
      hasil.guru = data.guru.length;
      for (const k of data.kelas) {
        const id = classKey(k.id);
        const [teacherRows] = k.nip_wali
          ? await db.execute<RowDataPacket[]>(
              "SELECT id FROM teachers WHERE school_id=? AND nip=?",
              [schoolId, k.nip_wali],
            )
          : [[] as RowDataPacket[]];
        const teacherId = teacherRows[0]?.["id"] ? String(teacherRows[0]["id"]) : null;
        await db.execute(
          `INSERT INTO classes (school_id,id,name,grade,group_name,homeroom_teacher_id,room,capacity)
           VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),grade=VALUES(grade),group_name=VALUES(group_name),homeroom_teacher_id=VALUES(homeroom_teacher_id),room=VALUES(room),capacity=VALUES(capacity)`,
          [
            schoolId,
            id,
            k.id,
            k.tingkat,
            k.rombel ?? null,
            teacherId,
            k.ruang ?? null,
            k.kapasitas ?? null,
          ],
        );
      }
      hasil.kelas = data.kelas.length;
      for (const s of data.siswa) {
        const [existing] = await db.execute<RowDataPacket[]>(
          "SELECT id FROM students WHERE school_id=? AND nisn=? FOR UPDATE",
          [schoolId, s.nisn],
        );
        const stableId = existing[0]?.["id"] ? String(existing[0]["id"]) : studentKey(s.nisn);
        await db.execute(
          `INSERT INTO students (school_id,id,nisn,nis,name,sex,birth_date,class_id,address,father_name,mother_name,guardian_name,guardian_phone,guardian_email)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE nis=VALUES(nis),name=VALUES(name),sex=VALUES(sex),birth_date=VALUES(birth_date),class_id=VALUES(class_id),address=VALUES(address),father_name=VALUES(father_name),mother_name=VALUES(mother_name),guardian_name=VALUES(guardian_name),guardian_phone=VALUES(guardian_phone),guardian_email=VALUES(guardian_email)`,
          [
            schoolId,
            stableId,
            s.nisn,
            s.nis ?? null,
            s.nama,
            s.jenis_kelamin ?? null,
            s.tanggal_lahir ?? null,
            classKey(s.kelas_id),
            s.alamat ?? null,
            s.nama_ayah ?? null,
            s.nama_ibu ?? null,
            s.nama_wali ?? null,
            s.telp_wali ?? null,
            s.email_wali ?? null,
          ],
        );
      }
      hasil.siswa = data.siswa.length;
      for (const h of data.kehadiran) {
        const [studentRows] = await db.execute<RowDataPacket[]>(
          "SELECT id,class_id FROM students WHERE school_id=? AND nisn=?",
          [schoolId, h.nisn],
        );
        const student = studentRows[0];
        if (!student || String(student["class_id"]) !== classKey(h.kelas_id))
          throw new Error(`NISN ${h.nisn} belum terdaftar pada kelas ${h.kelas_id}.`);
        const [manualRows] = await db.execute<RowDataPacket[]>(
          "SELECT source FROM attendance_records WHERE school_id=? AND student_id=? AND attendance_date=? FOR UPDATE",
          [schoolId, String(student["id"]), h.tanggal],
        );
        if (manualRows[0]?.["source"] === "Manual") continue;
        await db.execute(
          `INSERT INTO attendance_records (school_id,student_id,attendance_date,class_id,status,source,note,changed_by)
           VALUES (?,?,?,?,?,'Import',?,?) ON DUPLICATE KEY UPDATE class_id=VALUES(class_id),status=VALUES(status),source=VALUES(source),note=VALUES(note),changed_by=VALUES(changed_by),changed_at=NOW(3)`,
          [
            schoolId,
            String(student["id"]),
            h.tanggal,
            classKey(h.kelas_id),
            h.status,
            h.keterangan ?? null,
            sesi.email,
          ],
        );
      }
      hasil.kehadiran = data.kehadiran.length;
      await appendAudit(db, schoolId, sesi.email, "importSchoolData", hasil);
      await db.commit();
    } catch (error) {
      await db.rollback();
      throw error;
    } finally {
      db.release();
    }
    return hasil;
  });

export const ambilDataSekolah = createServerFn({ method: "GET" }).handler(async () => {
  const { requireIdentity } = await import("@/db/auth.server");
  const { mysqlPool } = await import("@/db/mysql.server");
  const { sesi } = await requireIdentity(["operator", "kepala_sekolah", "auditor"]);
  const sid = sesi.schoolId!;
  const [g] = await mysqlPool().query(
    "SELECT nip,name AS nama,subject AS mapel,employment_status AS status,homeroom_class AS wali_kelas FROM teachers WHERE school_id=? AND id LIKE 'DB-%'",
    [sid],
  );
  const [k] = await mysqlPool().query(
    "SELECT SUBSTRING(c.id,2) AS id,c.grade AS tingkat,c.room AS ruang,c.capacity AS kapasitas,t.nip AS nip_wali FROM classes c LEFT JOIN teachers t ON t.school_id=c.school_id AND t.id=c.homeroom_teacher_id WHERE c.school_id=? AND c.id LIKE 'K%'",
    [sid],
  );
  const [s] = await mysqlPool().query(
    "SELECT nisn,name AS nama,sex AS jenis_kelamin,SUBSTRING(class_id,2) AS kelas_id,father_name AS nama_ayah,mother_name AS nama_ibu,guardian_name AS nama_wali,guardian_phone AS telp_wali FROM students WHERE school_id=? AND id LIKE 'DB-%'",
    [sid],
  );
  const [h] = await mysqlPool().query(
    "SELECT DATE_FORMAT(a.attendance_date,'%Y-%m-%d') AS tanggal,s.nisn,SUBSTRING(a.class_id,2) AS kelas_id,a.status FROM attendance_records a JOIN students s ON s.school_id=a.school_id AND s.id=a.student_id WHERE a.school_id=? AND a.source='Import'",
    [sid],
  );
  return {
    guru: g as Array<{
      nip: string;
      nama: string;
      mapel: string | null;
      status: string | null;
      wali_kelas: string | null;
    }>,
    kelas: k as Array<{
      id: string;
      tingkat: number;
      ruang: string | null;
      kapasitas: number | null;
      nip_wali: string | null;
    }>,
    siswa: s as Array<{
      nisn: string;
      nama: string;
      jenis_kelamin: string | null;
      kelas_id: string;
      nama_ayah: string | null;
      nama_ibu: string | null;
      nama_wali: string | null;
      telp_wali: string | null;
    }>,
    kehadiran: h as Array<{ tanggal: string; nisn: string; kelas_id: string; status: string }>,
    error: null as string | null,
  };
});
