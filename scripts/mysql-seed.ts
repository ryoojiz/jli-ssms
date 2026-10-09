import "dotenv/config";
import mysql from "mysql2/promise";
import {
  SCHOOL,
  SEKOLAH_LOKASI,
  GURU,
  KELAS,
  SISWA,
  MAPEL,
  JADWAL,
  TUGAS,
  UJIAN,
  NILAI,
  PRESENSI_HARI_INI,
  TREN_KEHADIRAN,
  IZIN,
  ANGGARAN,
  TRANSAKSI,
  ARUS_KAS,
  ASET,
  PEMINJAMAN_ASET,
  MAINTENANCE,
  BUKU,
  SIRKULASI,
  KUNJUNGAN_UKS,
  ANTROPOMETRI,
  SCREENING,
  PENGUMUMAN,
  NOTIFIKASI,
  TAMU,
  INSIDEN,
  PERANGKAT,
  MATERI,
  KUIS,
  AUDIT_LOG,
  KPI_KATALOG,
  TREN_KPI,
  PERBANDINGAN_SEKOLAH,
  KUALITAS_DATA,
  LAPORAN_TERJADWAL,
  INGESTION,
} from "../src/lib/demo-data.ts";
import { SISTEM_INTEGRASI } from "../src/lib/integrasi-data.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL wajib diisi sebelum seed MySQL.");
const db = await mysql.createConnection(url);
const sid = SCHOOL.id;
const dt = (value: string) => value.replace("T", " ").replace(/Z$/, "");
const acak = (n: number, mod: number) => ((((n * 9301 + 49297) % 233280) + 233280) % 233280) % mod;
const put = async (table: string, row: Record<string, unknown>) => {
  // Table and column identifiers originate solely in this script, never in uploaded files.
  const stableColumn = Object.keys(row)[0];
  if (!stableColumn) throw new Error(`Seed ${table} tidak memiliki kolom.`);
  await db.query("INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE ??=??", [
    table,
    row,
    stableColumn,
    stableColumn,
  ]);
};
const all = async <T>(
  table: string,
  rows: readonly T[],
  map: (row: T) => Record<string, unknown>,
) => {
  for (const row of rows) await put(table, map(row));
  console.log(`${table}: ${rows.length}`);
};

try {
  await db.beginTransaction();
  for (const s of SEKOLAH_LOKASI) {
    await put("schools", {
      id: s.id,
      name: s.nama,
      npsn: s.npsn === "—" ? null : s.npsn,
      address: s.alamat,
      short_address: "alamatSingkat" in s ? s.alamatSingkat : null,
      latitude: s.koordinat.latitude,
      longitude: s.koordinat.longitude,
      principal_name: "kepalaSekolah" in s ? s.kepalaSekolah : null,
      academic_year: "tahunAjaran" in s ? s.tahunAjaran : null,
      semester: "semester" in s ? s.semester : null,
    });
  }
  await all("teachers", GURU, (g) => ({
    school_id: sid,
    id: g.id,
    nip: g.nip === "-" ? null : g.nip,
    name: g.nama,
    subject: g.mapel,
    employment_status: g.status,
  }));
  await all("classes", KELAS, (k) => ({
    school_id: sid,
    id: k.id,
    name: k.nama,
    grade: k.tingkat,
    room: k.ruang,
    capacity: k.jumlahSiswa,
    homeroom_teacher_id: GURU.find((g) => g.nama === k.waliKelas)?.id ?? null,
  }));
  await all("students", SISWA, (s) => ({
    school_id: sid,
    id: s.id,
    nisn: s.nisn,
    name: s.nama,
    class_id: s.kelasId,
    sex: s.jenisKelamin,
    guardian_name: s.namaWali,
    guardian_phone: s.telpWali,
    tag_uid: s.tagUid,
  }));
  await all("subjects", MAPEL, (name) => ({ school_id: sid, id: name, name }));
  // The teacher/subject scope mirrors the already implemented gradebook permissions.
  for (const subject of MAPEL.filter((m) => m !== "PJOK" && m !== "PAI & Budi Pekerti"))
    await put("teacher_assignments", {
      school_id: sid,
      teacher_id: "G06",
      class_id: "K5A",
      subject_id: subject,
    });
  for (const classId of ["K4A", "K5A", "K6A"])
    await put("teacher_assignments", {
      school_id: sid,
      teacher_id: "G10",
      class_id: classId,
      subject_id: "Bahasa Inggris",
    });
  await all("timetables", JADWAL, (r) => ({
    school_id: sid,
    id: r.id,
    day_name: r.hari,
    start_time: r.jamMulai,
    end_time: r.jamSelesai,
    class_id: r.kelasId,
    subject_name: r.mapel,
    teacher_name: r.guru,
    teacher_id: GURU.find((g) => g.nama === r.guru)?.id ?? null,
    room: r.ruang,
  }));
  await all("assignments", TUGAS, (r) => ({
    school_id: sid,
    id: r.id,
    title: r.judul,
    class_id: r.kelasId,
    subject_name: r.mapel,
    deadline: r.tenggat,
    teacher_id:
      GURU.find((g) =>
        JADWAL.some((j) => j.kelasId === r.kelasId && j.mapel === r.mapel && j.guru === g.nama),
      )?.id ?? null,
    submitted_count: r.dikumpulkan,
    total_count: r.total,
    status: r.status,
  }));
  for (const tugas of TUGAS) {
    const daftar = SISWA.filter((s) => s.kelasId === tugas.kelasId);
    const urutan = daftar
      .map((s, i) => ({ s, skor: acak(i * 31 + tugas.id.length * 7, 1000) }))
      .sort((a, b) => a.skor - b.skor);
    const jumlahKumpul = Math.round(
      daftar.length * (tugas.total > 0 ? tugas.dikumpulkan / tugas.total : 0),
    );
    const sudah = new Set(urutan.slice(0, jumlahKumpul).map((r) => r.s.id));
    for (const [i, siswa] of daftar.entries()) {
      const terkumpul = sudah.has(siswa.id);
      await put("assignment_submissions", {
        school_id: sid,
        assignment_id: tugas.id,
        student_id: siswa.id,
        submitted_at: terkumpul
          ? `${tugas.tenggat} ${String(8 + acak(i * 13, 9)).padStart(2, "0")}:${String(acak(i * 7, 60)).padStart(2, "0")}:00`
          : null,
        late: terkumpul && acak(i * 17 + 5, 10) < 2,
        initial_score: terkumpul ? 65 + acak(i * 23 + 9, 35) : null,
      });
    }
  }
  await all("exams", UJIAN, (r) => ({
    school_id: sid,
    id: r.id,
    name: r.nama,
    subject_name: r.mapel,
    class_id: r.kelasId,
    exam_date: r.tanggal,
    kind: r.jenis,
  }));
  await all("historic_grades", NILAI, (r) => ({
    school_id: sid,
    student_id: r.siswaId,
    subject_name: r.mapel,
    score: r.nilai,
  }));
  await all("attendance_records", PRESENSI_HARI_INI, (r) => ({
    school_id: sid,
    student_id: r.siswaId,
    attendance_date: r.tanggal,
    class_id: SISWA.find((s) => s.id === r.siswaId)!.kelasId,
    status: r.status,
    attendance_time: r.jam === "-" ? null : r.jam,
    source: r.sumber,
  }));
  await all("attendance_trends", TREN_KEHADIRAN, (r) => ({
    school_id: sid,
    day_label: r.hari,
    percent_value: r.persen,
  }));
  await all("historic_leave_samples", IZIN, (r) => ({
    school_id: sid,
    id: r.id,
    student_name: r.siswa,
    class_name: r.kelas,
    kind: r.jenis,
    request_date: r.tanggal,
    note: r.keterangan,
    status: r.status,
  }));
  await all("budget_lines", ANGGARAN, (r) => ({
    school_id: sid,
    id: r.id,
    code: r.kode,
    program: r.program,
    budget: r.pagu,
    realized: r.realisasi,
  }));
  await all("finance_transactions", TRANSAKSI, (r) => ({
    school_id: sid,
    id: r.id,
    transaction_date: r.tanggal,
    description: r.uraian,
    category: r.kategori,
    kind: r.jenis,
    amount: r.nominal,
    status: r.status,
  }));
  await all("cashflow_periods", ARUS_KAS, (r) => ({
    school_id: sid,
    period_key: r.bulan,
    inflow: r.masuk,
    outflow: r.keluar,
  }));
  await all("fixed_assets", ASET, (r) => ({
    school_id: sid,
    id: r.id,
    asset_code: r.kode,
    name: r.nama,
    category: r.kategori,
    location: r.lokasi,
    condition_label: r.kondisi,
    status: r.status,
    purchase_value: r.nilai,
  }));
  await all("asset_loans", PEMINJAMAN_ASET, (r) => ({
    school_id: sid,
    id: r.id,
    asset_name: r.aset,
    borrower: r.peminjam,
    loan_date: r.tanggal,
    return_date: r.kembali,
    status: r.status,
  }));
  await all("asset_maintenance", MAINTENANCE, (r) => ({
    school_id: sid,
    id: r.id,
    asset_name: r.aset,
    kind: r.jenis,
    scheduled_date: r.jadwal,
    technician: r.teknisi,
    status: r.status,
  }));
  await all("books", BUKU, (r) => ({
    school_id: sid,
    id: r.id,
    isbn: r.isbn,
    title: r.judul,
    author: r.pengarang,
    category: r.kategori,
    stock: r.stok,
    available: r.tersedia,
  }));
  await all("book_loans", SIRKULASI, (r) => ({
    school_id: sid,
    id: r.id,
    book_title: r.buku,
    borrower: r.peminjam,
    class_name: r.kelas,
    loan_date: r.pinjam,
    due_date: r.jatuhTempo,
    book_id: BUKU.find((b) => b.judul === r.buku)?.id ?? null,
    student_id:
      SISWA.find(
        (s) => s.nama === r.peminjam && KELAS.find((k) => k.id === s.kelasId)?.nama === r.kelas,
      )?.id ?? null,
    status: r.status,
  }));
  await put("library_rooms", {
    school_id: sid,
    id: "LIB-01",
    name: "Ruang Perpustakaan",
    capacity: 36,
  });
  await all("health_visits", KUNJUNGAN_UKS, (r) => ({
    school_id: sid,
    id: r.id,
    student_name: r.siswa,
    class_name: r.kelas,
    visit_date: r.tanggal,
    complaint: r.keluhan,
    treatment: r.tindakan,
    student_id:
      SISWA.find(
        (s) => s.nama === r.siswa && KELAS.find((k) => k.id === s.kelasId)?.nama === r.kelas,
      )?.id ?? null,
    status: r.status,
  }));
  await all("anthropometry_summaries", ANTROPOMETRI, (r) => ({
    school_id: sid,
    class_name: r.kelas,
    average_height: r.rataTinggi,
    average_weight: r.rataBerat,
    nutrition_status: r.statusGizi,
    normal_percent: r.persenNormal,
  }));
  await all("health_screenings", SCREENING, (r) => ({
    school_id: sid,
    kind: r.jenis,
    examined: r.diperiksa,
    findings: r.temuan,
  }));
  await all("announcements", PENGUMUMAN, (r) => ({
    school_id: sid,
    id: r.id,
    title: r.judul,
    body: r.isi,
    target: r.target,
    published_at: `${r.tanggal} 00:00:00`,
    author: r.pengirim,
  }));
  await all("outbound_messages", NOTIFIKASI, (r) => ({
    school_id: sid,
    id: r.id,
    channel_name: r.kanal,
    recipient: r.penerima,
    body: r.isi,
    time_label: r.waktu,
    status: r.status,
  }));
  await all("visitors", TAMU, (r) => ({
    school_id: sid,
    id: r.id,
    name: r.nama,
    organization: r.instansi,
    purpose: r.keperluan,
    arrived_at: r.masuk,
    left_at: r.keluar,
    status: r.status,
  }));
  await all("security_incidents", INSIDEN, (r) => ({
    school_id: sid,
    id: r.id,
    occurred_at: dt(r.waktu),
    kind: r.jenis,
    location: r.lokasi,
    source: r.sumber,
    severity: r.tingkat,
    status: r.status,
  }));
  await all("devices", PERANGKAT, (r) => ({
    school_id: sid,
    id: r.id,
    name: r.nama,
    type: r.tipe,
    location: r.lokasi,
    status: r.status,
    last_seen_label: r.terakhir,
  }));
  await all("learning_materials", MATERI, (r) => ({
    school_id: sid,
    id: r.id,
    title: r.judul,
    subject_name: r.mapel,
    class_id: r.kelasId,
    type: r.tipe,
    access_count: r.diakses,
  }));
  await all("quizzes", KUIS, (r) => ({
    school_id: sid,
    id: r.id,
    title: r.judul,
    class_id: r.kelasId,
    question_count: r.soal,
    participant_count: r.peserta,
    average_score: r.rataRata,
    status: r.status,
  }));
  await all("audit_events", AUDIT_LOG, (r) => ({
    school_id: sid,
    id: r.id,
    occurred_at: dt(r.waktu),
    actor: r.aktor,
    action_name: r.aksi,
    before_value: r.sebelum,
    after_value: r.sesudah,
    ip_address: r.ip,
  }));
  await all("kpi_catalog", KPI_KATALOG, (r) => ({
    school_id: sid,
    id: r.id,
    name: r.nama,
    formula: r.formula,
    source: r.sumber,
    owner_name: r.owner,
    frequency: r.frekuensi,
    version_label: r.versi,
    display_value: r.nilai,
    target_value: r.target,
    status: r.status,
    refreshed_at: dt(r.refresh),
  }));
  await all("kpi_trends", TREN_KPI, (r) => ({
    school_id: sid,
    period_key: r.periode,
    attendance: r.kehadiran,
    grade_average: r.nilai,
    budget_absorption: r.serapan,
  }));
  await all("school_comparison_samples", PERBANDINGAN_SEKOLAH, (r) => ({
    school_id: sid,
    compared_school_name: r.sekolah,
    attendance_percent: r.kehadiran,
    grade_average: r.nilai,
    budget_absorption: r.serapan,
    incident_count: r.insiden,
  }));
  await all("data_quality_checks", KUALITAS_DATA, (r) => ({
    school_id: sid,
    id: r.id,
    source: r.sumber,
    check_name: r.pemeriksaan,
    finding_count: r.temuan,
    threshold_count: r.ambang,
    status: r.status,
    checked_at: dt(r.terakhir),
  }));
  await all("scheduled_reports", LAPORAN_TERJADWAL, (r) => ({
    school_id: sid,
    id: r.id,
    name: r.nama,
    format_name: r.format,
    schedule_label: r.jadwal,
    recipients: r.penerima,
    status: r.status,
    last_run_at: dt(r.terakhir),
  }));
  await all("ingestion_status", INGESTION, (r) => ({
    school_id: sid,
    source: r.sumber,
    method_name: r.metode,
    event_count: r.event,
    lag_label: r.jeda,
    status: r.status,
  }));
  await all("integration_sources", SISTEM_INTEGRASI, (r) => ({
    school_id: sid,
    id: r.id,
    name: r.nama,
    category: r.kategori,
    method_name: r.sumber,
    status: r.status,
    last_sync_label: r.sinkronTerakhir,
    notes: JSON.stringify({
      url: r.url,
      utama: r.utama,
      indikator: r.indikator,
      kolom: r.kolom,
      baris: r.baris,
    }),
  }));
  await db.commit();
  console.log("Seed selesai. Akun tidak dibuat otomatis; jalankan db:bootstrap-account.");
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
