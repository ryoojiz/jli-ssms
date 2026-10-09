import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";

// Identifiers are fixed server-side; requests never supply SQL table or column names.
const tables = {
  GURU: "teachers",
  KELAS: "classes",
  SISWA: "students",
  MAPEL: "subjects",
  JADWAL: "timetables",
  TUGAS: "assignments",
  UJIAN: "exams",
  NILAI: "historic_grades",
  PRESENSI_HARI_INI: "attendance_records",
  TREN_KEHADIRAN: "attendance_trends",
  IZIN: "historic_leave_samples",
  ANGGARAN: "budget_lines",
  TRANSAKSI: "finance_transactions",
  ARUS_KAS: "cashflow_periods",
  ASET: "fixed_assets",
  PEMINJAMAN_ASET: "asset_loans",
  MAINTENANCE: "asset_maintenance",
  BUKU: "books",
  SIRKULASI: "book_loans",
  KUNJUNGAN_UKS: "health_visits",
  ANTROPOMETRI: "anthropometry_summaries",
  SCREENING: "health_screenings",
  PENGUMUMAN: "announcements",
  NOTIFIKASI: "outbound_messages",
  TAMU: "visitors",
  INSIDEN: "security_incidents",
  PERANGKAT: "devices",
  MATERI: "learning_materials",
  KUIS: "quizzes",
  AUDIT_LOG: "audit_events",
  KPI_KATALOG: "kpi_catalog",
  TREN_KPI: "kpi_trends",
  PERBANDINGAN_SEKOLAH: "school_comparison_samples",
  KUALITAS_DATA: "data_quality_checks",
  LAPORAN_TERJADWAL: "scheduled_reports",
  INGESTION: "ingestion_status",
  SISTEM_INTEGRASI: "integration_sources",
  PENGUMPULAN_TUGAS: "assignment_submissions",
} as const;

export const getSchoolSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const { requireIdentity } = await import("@/db/auth.server");
  const { mysqlPool, mysqlDb } = await import("@/db/mysql.server");
  const { schools } = await import("@/db/schema");
  const { userId, sesi } = await requireIdentity();
  const sid = sesi.schoolId!;
  const role = sesi.peran;
  const broad = ["operator", "kepala_sekolah", "auditor"].includes(role);
  const teacher = ["guru", "wali_kelas"].includes(role);
  const child = ["walimurid", "siswa"].includes(role);
  const rows = async (sql: string, params: Array<string | number> = []) =>
    (await mysqlPool().execute<RowDataPacket[]>(sql, params))[0];
  const directory = await mysqlDb().select().from(schools);
  const school = (await rows("SELECT * FROM schools WHERE id=?", [sid]))[0];
  if (!school) throw new Error("Sekolah aktif tidak ditemukan.");

  let studentIds: string[] = [];
  let classIds: string[] = [];
  if (broad || role === "uks") {
    studentIds = (await rows("SELECT id FROM students WHERE school_id=?", [sid])).map((r) =>
      String(r["id"]),
    );
    classIds = (await rows("SELECT id FROM classes WHERE school_id=?", [sid])).map((r) =>
      String(r["id"]),
    );
  } else if (teacher && sesi.guruId) {
    classIds = (
      await rows(
        `SELECT DISTINCT c.id FROM classes c LEFT JOIN teacher_assignments a
      ON a.school_id=c.school_id AND a.class_id=c.id AND a.teacher_id=?
      WHERE c.school_id=? AND (c.homeroom_teacher_id=? OR a.teacher_id IS NOT NULL)`,
        [sesi.guruId, sid, sesi.guruId],
      )
    ).map((r) => String(r["id"]));
    if (classIds.length)
      studentIds = (
        await rows(
          `SELECT id FROM students WHERE school_id=? AND class_id IN (${classIds.map(() => "?").join(",")})`,
          [sid, ...classIds],
        )
      ).map((r) => String(r["id"]));
  } else if (child && sesi.siswaId) {
    const linked =
      role === "walimurid"
        ? await rows(
            "SELECT student_id FROM parent_student_links WHERE school_id=? AND user_id=? AND student_id=?",
            [sid, userId, sesi.siswaId],
          )
        : await rows("SELECT id AS student_id FROM students WHERE school_id=? AND id=?", [
            sid,
            sesi.siswaId,
          ]);
    if (!linked.length) throw new Error("Hubungan siswa tidak ditemukan.");
    studentIds = [sesi.siswaId];
    classIds = (
      await rows("SELECT class_id FROM students WHERE school_id=? AND id=?", [sid, sesi.siswaId])
    ).map((r) => String(r["class_id"]));
  }
  const schoolRows = async (table: string) =>
    rows(`SELECT * FROM ${table} WHERE school_id=?`, [sid]);
  const studentRows = async (table: string, column: string) =>
    studentIds.length
      ? rows(
          `SELECT * FROM ${table} WHERE school_id=? AND ${column} IN (${studentIds.map(() => "?").join(",")})`,
          [sid, ...studentIds],
        )
      : [];
  const classRows = async (table: string, column: string) =>
    classIds.length
      ? rows(
          `SELECT * FROM ${table} WHERE school_id=? AND ${column} IN (${classIds.map(() => "?").join(",")})`,
          [sid, ...classIds],
        )
      : [];
  const results: Record<string, RowDataPacket[]> = {};
  for (const [key, table] of Object.entries(tables)) {
    if (key === "SISWA")
      results[key] = studentIds.length
        ? await rows(
            `SELECT id,nisn,name,class_id,sex,guardian_name,guardian_phone,tag_uid
          FROM students WHERE school_id=? AND id IN (${studentIds.map(() => "?").join(",")})`,
            [sid, ...studentIds],
          )
        : [];
    else if (key === "NILAI" || key === "PRESENSI_HARI_INI" || key === "PENGUMPULAN_TUGAS")
      results[key] = await studentRows(table, "student_id");
    else if (["JADWAL", "TUGAS", "UJIAN", "MATERI", "KUIS"].includes(key))
      results[key] = broad ? await schoolRows(table) : await classRows(table, "class_id");
    else if (key === "GURU")
      results[key] = await rows(
        broad || teacher
          ? "SELECT id,nip,name,subject,employment_status FROM teachers WHERE school_id=?"
          : "SELECT id,NULL AS nip,name,subject,employment_status FROM teachers WHERE school_id=?",
        [sid],
      );
    else if (["KELAS", "MAPEL", "BUKU"].includes(key)) results[key] = await schoolRows(table);
    else if (["ANGGARAN", "TRANSAKSI", "ARUS_KAS"].includes(key))
      results[key] = ["bendahara", "operator", "kepala_sekolah", "auditor"].includes(role)
        ? await schoolRows(table)
        : [];
    else if (["ASET", "PEMINJAMAN_ASET", "MAINTENANCE"].includes(key))
      results[key] = ["sarpras", "bendahara", "operator", "kepala_sekolah", "auditor"].includes(
        role,
      )
        ? await schoolRows(table)
        : [];
    else if (key === "SIRKULASI")
      results[key] = ["pustakawan", "operator", "kepala_sekolah", "auditor"].includes(role)
        ? await schoolRows(table)
        : [];
    else if (key === "KUNJUNGAN_UKS")
      results[key] = ["uks", "operator", "kepala_sekolah", "auditor"].includes(role)
        ? await schoolRows(table)
        : [];
    else if (["ANTROPOMETRI", "SCREENING"].includes(key))
      results[key] = ["uks", "operator", "kepala_sekolah", "auditor", "wali_kelas"].includes(role)
        ? await schoolRows(table)
        : [];
    else if (key === "NOTIFIKASI") results[key] = broad ? await schoolRows(table) : [];
    else if (["TAMU", "INSIDEN", "PERANGKAT"].includes(key))
      results[key] = ["keamanan", "sarpras", "operator", "kepala_sekolah", "auditor"].includes(role)
        ? await schoolRows(table)
        : [];
    else if (key === "AUDIT_LOG") results[key] = broad ? await schoolRows(table) : [];
    else if (
      [
        "KPI_KATALOG",
        "TREN_KPI",
        "PERBANDINGAN_SEKOLAH",
        "KUALITAS_DATA",
        "LAPORAN_TERJADWAL",
        "INGESTION",
        "SISTEM_INTEGRASI",
      ].includes(key)
    )
      results[key] = broad ? await schoolRows(table) : [];
    else if (key === "IZIN") results[key] = broad ? await schoolRows(table) : [];
    else if (key === "PENGUMUMAN")
      results[key] = []; // Audience-filtered through getWorkflowSnapshot.
    else results[key] = await schoolRows(table);
  }
  return { school, directory, results };
});
