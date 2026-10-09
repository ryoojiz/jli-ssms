import { createHash } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

type Cell = string | number | boolean | null;
type Cells = Record<string, Cell>;
const id = (sheet: string, key: string) =>
  `IM-${createHash("sha256").update(`${sheet}:${key}`).digest("hex").slice(0, 32)}`;
const value = (data: Cells, column: string, max = 300) => {
  const raw = data[column];
  const text = raw == null ? "" : String(raw).trim();
  if (!text || text.length > max)
    throw new Error(`Kolom ${column} wajib diisi (maksimal ${max} karakter).`);
  return text;
};
const optional = (data: Cells, column: string, max = 500) => {
  const raw = data[column];
  if (raw == null || String(raw).trim() === "") return null;
  const text = String(raw).trim();
  if (text.length > max) throw new Error(`Kolom ${column} terlalu panjang.`);
  return text;
};
const number = (data: Cells, column: string, min = 0, max = 1e15) => {
  const n = Number(data[column]);
  if (data[column] == null || !Number.isFinite(n) || n < min || n > max)
    throw new Error(`Kolom ${column} harus angka ${min}–${max}.`);
  return n;
};
const day = (data: Cells, column: string) => {
  const v = value(data, column, 10).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) !== v)
    throw new Error(`Kolom ${column} bukan tanggal YYYY-MM-DD.`);
  return v;
};
const clock = (data: Cells, column: string) => {
  const v = value(data, column, 8).slice(0, 5);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw new Error(`Kolom ${column} bukan jam HH:mm.`);
  return v;
};
const classId = (data: Cells, column: string) => {
  const v = value(data, column, 40).toUpperCase();
  return v.startsWith("K") ? v : `K${v}`;
};
async function studentId(db: PoolConnection, sid: string, nisn: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM students WHERE school_id=? AND nisn=?",
    [sid, nisn],
  );
  if (!rows[0]) throw new Error(`NISN ${nisn} belum terdaftar di sekolah aktif.`);
  return String(rows[0]["id"]);
}
async function teacherId(db: PoolConnection, sid: string, nip: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM teachers WHERE school_id=? AND nip=?",
    [sid, nip],
  );
  if (!rows[0]) throw new Error(`NIP ${nip} belum terdaftar di sekolah aktif.`);
  return String(rows[0]["id"]);
}
async function ensureTeachingAssignment(
  db: PoolConnection,
  sid: string,
  teacher: string,
  classKey: string,
  subject: string,
) {
  const [classes] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM classes WHERE school_id=? AND id=?",
    [sid, classKey],
  );
  if (!classes[0]) throw new Error(`Kelas ${classKey} belum terdaftar di sekolah aktif.`);
  await db.execute(
    "INSERT INTO subjects (school_id,id,name) VALUES (?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)",
    [sid, subject, subject],
  );
  await db.execute(
    "INSERT IGNORE INTO teacher_assignments (school_id,teacher_id,class_id,subject_id) VALUES (?,?,?,?)",
    [sid, teacher, classKey, subject],
  );
}
async function upsert(
  db: PoolConnection,
  table: string,
  row: Record<string, unknown>,
  keys: string[],
) {
  const columns = Object.keys(row);
  const updates = columns.filter((column) => !keys.includes(column));
  const escaped = (column: string) => `\`${column.replaceAll("`", "``")}\``;
  const clause = updates.length
    ? updates.map((column) => `${escaped(column)}=VALUES(${escaped(column)})`).join(",")
    : `${escaped(keys[0]!)}=${escaped(keys[0]!)}`;
  await db.execute(
    `INSERT INTO ${escaped(table)} (${columns.map(escaped).join(",")}) VALUES (${columns.map(() => "?").join(",")}) ON DUPLICATE KEY UPDATE ${clause}`,
    columns.map((column) => row[column] as string | number | boolean | Date | null),
  );
}

export async function persistModuleRow(
  db: PoolConnection,
  sid: string,
  sheet: string,
  key: string,
  d: Cells,
) {
  const rowKey = id(sheet, key);
  switch (sheet) {
    case "KPI":
      await upsert(
        db,
        "kpi_catalog",
        {
          school_id: sid,
          id: value(d, "Kode KPI", 40),
          name: value(d, "Nama Indikator", 200),
          formula: "TBD — tidak ada di template impor",
          source: "Impor Excel",
          owner_name: optional(d, "Penanggung Jawab", 120) ?? "TBD",
          frequency: "TBD",
          version_label: "import",
          display_value: optional(d, "Realisasi", 80) ?? "TBD",
          target_value: optional(d, "Target", 80) ?? "TBD",
          status: "Impor",
          refreshed_at: null,
        },
        ["school_id", "id"],
      );
      return;
    case "Kualitas Data":
      await upsert(
        db,
        "imported_quality_checks",
        {
          school_id: sid,
          row_key: key,
          check_date: day(d, "Tanggal Cek"),
          dataset_name: value(d, "Tabel/Data", 160),
          row_count: number(d, "Jumlah Baris"),
          complete_count: number(d, "Baris Lengkap"),
          duplicate_count: number(d, "Baris Duplikat"),
          invalid_count: number(d, "Baris Tidak Valid"),
          status: optional(d, "Status", 40),
          note: optional(d, "Catatan", 1000),
        },
        ["school_id", "row_key"],
      );
      return;
    case "Pipeline Ingestion":
      await upsert(
        db,
        "imported_pipelines",
        {
          school_id: sid,
          pipeline_id: value(d, "ID Pipeline", 40),
          source_name: value(d, "Sumber Data", 120),
          destination_name: optional(d, "Tujuan", 120),
          frequency_label: optional(d, "Frekuensi", 80),
          last_run_label: optional(d, "Waktu Terakhir", 80),
          status: optional(d, "Status", 30),
          row_count: number(d, "Jumlah Baris"),
          duration_seconds: d["Durasi (detik)"] == null ? null : number(d, "Durasi (detik)"),
          error_message: optional(d, "Pesan Error", 1000),
        },
        ["school_id", "pipeline_id"],
      );
      await upsert(
        db,
        "ingestion_status",
        {
          school_id: sid,
          source: value(d, "Sumber Data", 120),
          method_name: optional(d, "Frekuensi", 80) ?? "TBD",
          event_count: number(d, "Jumlah Baris"),
          lag_label: optional(d, "Durasi (detik)", 40) ?? "TBD",
          status: optional(d, "Status", 30) ?? "Impor",
        },
        ["school_id", "source"],
      );
      return;
    case "Laporan Terjadwal":
      await upsert(
        db,
        "scheduled_reports",
        {
          school_id: sid,
          id: value(d, "ID Laporan", 40),
          name: value(d, "Nama Laporan", 200),
          format_name: optional(d, "Format", 20) ?? "TBD",
          schedule_label: optional(d, "Jadwal", 120) ?? "TBD",
          recipients: optional(d, "Penerima (email)", 500) ?? "TBD",
          status: optional(d, "Status Aktif", 30) ?? "Impor",
          last_run_at: null,
        },
        ["school_id", "id"],
      );
      return;
    case "Jadwal": {
      const teacher = await teacherId(db, sid, value(d, "NIP Guru", 40));
      const classroom = classId(d, "Kelas");
      const subject = value(d, "Mata Pelajaran", 60);
      await ensureTeachingAssignment(db, sid, teacher, classroom, subject);
      await upsert(
        db,
        "timetables",
        {
          school_id: sid,
          id: rowKey,
          day_name: value(d, "Hari", 12),
          start_time: clock(d, "Jam Mulai"),
          end_time: clock(d, "Jam Selesai"),
          class_id: classroom,
          subject_name: subject,
          teacher_name: value(d, "Nama Guru", 160),
          teacher_id: teacher,
          room: optional(d, "Ruang", 80) ?? "-",
        },
        ["school_id", "id"],
      );
      return;
    }
    case "Tugas": {
      const teacher = await teacherId(db, sid, value(d, "NIP Guru", 40));
      const classroom = classId(d, "Kelas");
      const subject = value(d, "Mata Pelajaran", 60);
      await ensureTeachingAssignment(db, sid, teacher, classroom, subject);
      await upsert(
        db,
        "assignments",
        {
          school_id: sid,
          id: value(d, "ID Tugas", 40),
          title: value(d, "Judul", 160),
          class_id: classroom,
          subject_name: subject,
          deadline: day(d, "Tenggat"),
          teacher_id: teacher,
          submitted_count: 0,
          total_count: 0,
          status: "Draft",
        },
        ["school_id", "id"],
      );
      return;
    }
    case "Ujian":
      await upsert(
        db,
        "exams",
        {
          school_id: sid,
          id: value(d, "ID Ujian", 40),
          name: value(d, "Nama Ujian", 160),
          subject_name: value(d, "Mata Pelajaran", 160),
          class_id: classId(d, "Kelas"),
          exam_date: day(d, "Tanggal"),
          kind: value(d, "Jenis", 24),
        },
        ["school_id", "id"],
      );
      return;
    case "Nilai E-Rapor": {
      const student = await studentId(db, sid, value(d, "NISN", 20));
      await upsert(
        db,
        "imported_grades",
        {
          school_id: sid,
          row_key: key,
          student_id: student,
          class_id: classId(d, "Kelas"),
          subject_name: value(d, "Mata Pelajaran", 160),
          grade_kind: value(d, "Jenis Nilai", 40),
          score: number(d, "Nilai (0-100)", 0, 100),
          semester: value(d, "Semester", 40),
          academic_year: value(d, "Tahun Ajaran", 24),
          teacher_note: optional(d, "Catatan Guru", 1000),
        },
        ["school_id", "row_key"],
      );
      return;
    }
    case "Keuangan":
      await upsert(
        db,
        "finance_transactions",
        {
          school_id: sid,
          id: value(d, "No. Bukti", 40),
          transaction_date: day(d, "Tanggal"),
          description: value(d, "Uraian", 300),
          category: value(d, "Kategori", 60),
          kind: value(d, "Jenis", 30),
          amount: number(d, "Jumlah (Rp)"),
          status: "Impor",
        },
        ["school_id", "id"],
      );
      return;
    case "Inventaris":
      await upsert(
        db,
        "fixed_assets",
        {
          school_id: sid,
          id: rowKey,
          asset_code: value(d, "Kode Barang", 80),
          name: value(d, "Nama Barang", 200),
          category: value(d, "Kategori", 80),
          location: value(d, "Lokasi/Ruang", 100),
          condition_label: value(d, "Kondisi", 40),
          status: "Tercatat",
          purchase_value: number(d, "Harga Satuan (Rp)"),
          quantity: number(d, "Jumlah", 0, 1000000),
        },
        ["school_id", "id"],
      );
      return;
    case "Buku Perpustakaan": {
      const bookId = value(d, "Kode Buku", 40),
        stock = number(d, "Jumlah Eksemplar", 0, 1000000);
      const [current] = await db.execute<RowDataPacket[]>(
        "SELECT stock,available FROM books WHERE school_id=? AND id=? FOR UPDATE",
        [sid, bookId],
      );
      const available = current[0]
        ? Number(current[0]["available"]) + stock - Number(current[0]["stock"])
        : stock;
      if (available < 0 || available > stock)
        throw new Error("Jumlah eksemplar bertentangan dengan buku yang sedang dipinjam.");
      await upsert(
        db,
        "books",
        {
          school_id: sid,
          id: bookId,
          isbn: value(d, "ISBN", 40),
          title: value(d, "Judul", 240),
          author: value(d, "Pengarang", 160),
          category: value(d, "Kategori", 80),
          stock,
          available,
          publisher: optional(d, "Penerbit", 160),
          publication_year: d["Tahun"] == null ? null : number(d, "Tahun", 0, 9999),
          shelf: optional(d, "Rak", 80),
        },
        ["school_id", "id"],
      );
      return;
    }
    case "Peminjaman Buku": {
      const student = await studentId(db, sid, value(d, "NISN", 20));
      const [students] = await db.execute<RowDataPacket[]>(
        "SELECT s.name,c.name AS class_name FROM students s JOIN classes c ON c.school_id=s.school_id AND c.id=s.class_id WHERE s.school_id=? AND s.id=?",
        [sid, student],
      );
      const [books] = await db.execute<RowDataPacket[]>(
        "SELECT title FROM books WHERE school_id=? AND id=?",
        [sid, value(d, "Kode Buku", 40)],
      );
      if (!books[0]) throw new Error("Buku peminjaman belum terdaftar.");
      await upsert(
        db,
        "book_loans",
        {
          school_id: sid,
          id: value(d, "ID Pinjam", 40),
          book_title: String(books[0]["title"]),
          borrower: String(students[0]!["name"]),
          class_name: String(students[0]!["class_name"]),
          loan_date: day(d, "Tanggal Pinjam"),
          due_date: day(d, "Jatuh Tempo"),
          book_id: value(d, "Kode Buku", 40),
          student_id: student,
          status: optional(d, "Status", 30) ?? "Impor",
        },
        ["school_id", "id"],
      );
      return;
    }
    case "Kesehatan UKS": {
      const student = await studentId(db, sid, value(d, "NISN", 20));
      await upsert(
        db,
        "health_visits",
        {
          school_id: sid,
          id: value(d, "ID Kunjungan", 40),
          student_name: value(d, "Nama Siswa", 160),
          class_name: value(d, "Kelas", 40),
          visit_date: day(d, "Tanggal"),
          complaint: value(d, "Keluhan", 300),
          treatment: value(d, "Tindakan", 300),
          student_id: student,
          status: "Impor",
        },
        ["school_id", "id"],
      );
      return;
    }
    case "Pemeriksaan Kesehatan": {
      const student = await studentId(db, sid, value(d, "NISN", 20));
      await upsert(
        db,
        "health_screening_records",
        {
          school_id: sid,
          student_id: student,
          screening_date: day(d, "Tanggal"),
          height_cm: d["Tinggi (cm)"] == null ? null : number(d, "Tinggi (cm)", 0, 300),
          weight_kg: d["Berat (kg)"] == null ? null : number(d, "Berat (kg)", 0, 500),
          vision: optional(d, "Penglihatan", 100),
          dental: optional(d, "Gigi", 100),
          immunization_complete:
            d["Imunisasi Lengkap"] == null
              ? null
              : ["ya", "true", "1"].includes(String(d["Imunisasi Lengkap"]).toLowerCase()),
          note: optional(d, "Catatan", 1000),
        },
        ["school_id", "student_id", "screening_date"],
      );
      return;
    }
    case "Komunikasi": {
      const target = value(d, "Sasaran", 32);
      if (!["Semua", "Orang Tua", "Guru", "Kelas 1-3", "Kelas 4-6"].includes(target))
        throw new Error(`Sasaran ${target} tidak dikenal; periksa template.`);
      await upsert(
        db,
        "announcements",
        {
          school_id: sid,
          id: value(d, "ID Pengumuman", 40),
          title: value(d, "Judul", 160),
          body: value(d, "Isi", 2000),
          target,
          published_at: `${day(d, "Tanggal")} 00:00:00`,
          author: value(d, "Pengirim", 190),
        },
        ["school_id", "id"],
      );
      return;
    }
    case "Izin Siswa":
      await upsert(
        db,
        "historic_leave_samples",
        {
          school_id: sid,
          id: value(d, "ID Izin", 40),
          student_name: value(d, "Nama Siswa", 160),
          class_name: value(d, "Kelas", 40),
          kind: value(d, "Jenis", 20),
          request_date: day(d, "Tanggal"),
          note: value(d, "Alasan", 500),
          status: value(d, "Status", 30),
        },
        ["school_id", "id"],
      );
      return;
    case "Smart Security - CCTV":
      await upsert(
        db,
        "devices",
        {
          school_id: sid,
          id: value(d, "ID Kamera", 40),
          name: value(d, "Nama/Lokasi", 160),
          type: "CCTV",
          location: value(d, "Area", 120),
          status: value(d, "Status", 40),
          last_seen_label: optional(d, "Terakhir Dicek", 80) ?? "TBD",
        },
        ["school_id", "id"],
      );
      return;
    case "Smart Security - Kejadian":
      await upsert(
        db,
        "security_incidents",
        {
          school_id: sid,
          id: value(d, "ID Kejadian", 40),
          occurred_at: `${day(d, "Tanggal")} ${clock(d, "Jam")}:00`,
          kind: value(d, "Jenis Kejadian", 160),
          location: value(d, "Lokasi", 120),
          source: "Impor Excel",
          severity: value(d, "Tingkat", 30),
          status: value(d, "Status", 30),
        },
        ["school_id", "id"],
      );
      return;
    case "Smart Security - Akses":
      await upsert(
        db,
        "access_events",
        {
          school_id: sid,
          row_key: key,
          event_date: day(d, "Tanggal"),
          event_time: clock(d, "Jam"),
          person_name: value(d, "Nama", 160),
          role_name: optional(d, "Peran", 80),
          access_point: value(d, "Titik Akses", 120),
          direction_name: optional(d, "Arah", 40),
          method_name: optional(d, "Metode", 40),
        },
        ["school_id", "row_key"],
      );
      return;
    default:
      if (
        [
          "Aset JakAset",
          "Kehadiran ASN",
          "Ketidakhadiran ASN",
          "E-Kinerja",
          "Kepegawaian",
          "RKAS",
          "SIPLah",
          "Dapodik",
          "Mutasi SIAP",
          "Info GTK TPG",
        ].includes(sheet)
      ) {
        const subject =
          optional(d, "NIP", 100) ??
          optional(d, "NISN", 100) ??
          optional(d, "Kode Barang", 100) ??
          null;
        const possibleDate = optional(d, "Tanggal", 10) ?? optional(d, "Tanggal Mulai", 10);
        await upsert(
          db,
          "integration_records",
          {
            school_id: sid,
            source_sheet: sheet,
            external_key: key,
            subject_ref: subject,
            event_date:
              possibleDate && /^\d{4}-\d{2}-\d{2}$/.test(possibleDate) ? possibleDate : null,
            data_json: JSON.stringify(d),
            updated_at: new Date(),
          },
          ["school_id", "source_sheet", "external_key"],
        );
        return;
      }
      throw new Error(`Sheet ${sheet} belum memiliki pemetaan tabel MySQL.`);
  }
}
