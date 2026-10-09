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
  DISTRIBUSI_NILAI,
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
} from "@/lib/demo-data";
import { SISTEM_INTEGRASI } from "@/lib/integrasi-data";
import { PENGUMPULAN_TUGAS } from "@/lib/guru-data";
import { getSchoolSnapshot } from "@/lib/school-data.functions";

type Row = Record<string, unknown>;
const str = (value: unknown) => (value == null ? "" : String(value));
const num = (value: unknown) => Number(value ?? 0);
const date = (value: unknown) => str(value).slice(0, 10);
const time = (value: unknown) => str(value).slice(0, 5);
let version = 0;
const listeners = new Set<(version: number) => void>();
export const jumlahDariCloud = { guru: 0, kelas: 0, siswa: 0, kehadiran: 0 };

export async function hydrateSchoolData() {
  const snapshot = await getSchoolSnapshot();
  const raw = snapshot.results as Record<string, Row[]>;
  const map = <T>(target: T[], key: string, mapper: (row: Row) => T) => {
    target.splice(0, target.length, ...(raw[key] ?? []).map(mapper));
  };
  const school = snapshot.school as Row;
  Object.assign(SCHOOL, {
    id: str(school["id"]),
    nama: str(school["name"]),
    npsn: str(school["npsn"]),
    alamat: str(school["address"]),
    alamatSingkat: str(school["short_address"]),
    koordinat: { latitude: num(school["latitude"]), longitude: num(school["longitude"]) },
    kepalaSekolah: str(school["principal_name"]),
    tahunAjaran: str(school["academic_year"]),
    semester: str(school["semester"]),
  });
  const locations = snapshot.directory.map((r) => ({
    id: r.id,
    nama: r.name,
    npsn: r.npsn ?? "—",
    alamat: r.address ?? "",
    koordinat: { latitude: num(r.latitude), longitude: num(r.longitude) },
    ...(r.shortAddress ? { alamatSingkat: r.shortAddress } : {}),
    ...(r.principalName ? { kepalaSekolah: r.principalName } : {}),
    ...(r.academicYear ? { tahunAjaran: r.academicYear } : {}),
    ...(r.semester ? { semester: r.semester } : {}),
  }));
  (SEKOLAH_LOKASI as unknown as typeof locations).splice(0, SEKOLAH_LOKASI.length, ...locations);
  map(GURU, "GURU", (r) => ({
    id: str(r["id"]),
    nip: str(r["nip"]),
    nama: str(r["name"]),
    mapel: str(r["subject"]),
    status: (r["employment_status"] === "PNS" || r["employment_status"] === "PPPK"
      ? r["employment_status"]
      : "Honorer") as "PNS" | "PPPK" | "Honorer",
  }));
  map(KELAS, "KELAS", (r) => ({
    id: str(r["id"]),
    nama: str(r["name"]),
    tingkat: num(r["grade"]),
    waliKelas: GURU.find((g) => g.id === r["homeroom_teacher_id"])?.nama ?? "-",
    ruang: str(r["room"]),
    jumlahSiswa: num(r["capacity"]),
  }));
  map(SISWA, "SISWA", (r) => ({
    id: str(r["id"]),
    nisn: str(r["nisn"]),
    nama: str(r["name"]),
    kelasId: str(r["class_id"]),
    jenisKelamin: r["sex"] === "L" ? ("L" as const) : ("P" as const),
    namaWali: str(r["guardian_name"]),
    telpWali: str(r["guardian_phone"]),
    tagUid: str(r["tag_uid"]),
  }));
  map(MAPEL, "MAPEL", (r) => str(r["name"]));
  map(JADWAL, "JADWAL", (r) => ({
    id: str(r["id"]),
    hari: str(r["day_name"]) as (typeof JADWAL)[number]["hari"],
    jamMulai: time(r["start_time"]),
    jamSelesai: time(r["end_time"]),
    kelasId: str(r["class_id"]),
    mapel: str(r["subject_name"]),
    guru: str(r["teacher_name"]),
    ruang: str(r["room"]),
  }));
  map(TUGAS, "TUGAS", (r) => ({
    id: str(r["id"]),
    judul: str(r["title"]),
    kelasId: str(r["class_id"]),
    mapel: str(r["subject_name"]),
    tenggat: date(r["deadline"]),
    dikumpulkan: num(r["submitted_count"]),
    total: num(r["total_count"]),
    status: str(r["status"]) as (typeof TUGAS)[number]["status"],
  }));
  map(PENGUMPULAN_TUGAS, "PENGUMPULAN_TUGAS", (r) => ({
    tugasId: str(r["assignment_id"]),
    siswaId: str(r["student_id"]),
    waktu: r["submitted_at"] ? str(r["submitted_at"]) : null,
    terlambat: Boolean(r["late"]),
    nilaiAwal: r["initial_score"] == null ? null : num(r["initial_score"]),
  }));
  map(UJIAN, "UJIAN", (r) => ({
    id: str(r["id"]),
    nama: str(r["name"]),
    mapel: str(r["subject_name"]),
    kelasId: str(r["class_id"]),
    tanggal: date(r["exam_date"]),
    jenis: str(r["kind"]) as (typeof UJIAN)[number]["jenis"],
  }));
  map(NILAI, "NILAI", (r) => ({
    siswaId: str(r["student_id"]),
    mapel: str(r["subject_name"]),
    nilai: num(r["score"]),
  }));
  const bins = [
    ["< 70", (n: number) => n < 70],
    ["70–79", (n: number) => n >= 70 && n < 80],
    ["80–89", (n: number) => n >= 80 && n < 90],
    ["≥ 90", (n: number) => n >= 90],
  ] as const;
  DISTRIBUSI_NILAI.splice(
    0,
    DISTRIBUSI_NILAI.length,
    ...bins.map(([rentang, filter]) => ({
      rentang,
      jumlah: NILAI.filter((n) => filter(n.nilai)).length,
    })),
  );
  map(PRESENSI_HARI_INI, "PRESENSI_HARI_INI", (r) => ({
    siswaId: str(r["student_id"]),
    tanggal: date(r["attendance_date"]),
    status: str(r["status"]) as (typeof PRESENSI_HARI_INI)[number]["status"],
    jam: r["attendance_time"] ? time(r["attendance_time"]) : "-",
    sumber: str(r["source"]) as (typeof PRESENSI_HARI_INI)[number]["sumber"],
  }));
  map(TREN_KEHADIRAN, "TREN_KEHADIRAN", (r) => ({
    hari: str(r["day_label"]),
    persen: num(r["percent_value"]),
  }));
  map(IZIN, "IZIN", (r) => ({
    id: str(r["id"]),
    siswa: str(r["student_name"]),
    kelas: str(r["class_name"]),
    jenis: str(r["kind"]),
    tanggal: date(r["request_date"]),
    keterangan: str(r["note"]),
    status: str(r["status"]),
  }));
  map(ANGGARAN, "ANGGARAN", (r) => ({
    id: str(r["id"]),
    kode: str(r["code"]),
    program: str(r["program"]),
    pagu: num(r["budget"]),
    realisasi: num(r["realized"]),
  }));
  map(TRANSAKSI, "TRANSAKSI", (r) => ({
    id: str(r["id"]),
    tanggal: date(r["transaction_date"]),
    uraian: str(r["description"]),
    kategori: str(r["category"]),
    jenis: str(r["kind"]),
    nominal: num(r["amount"]),
    status: str(r["status"]),
  }));
  map(ARUS_KAS, "ARUS_KAS", (r) => ({
    bulan: str(r["period_key"]),
    masuk: num(r["inflow"]),
    keluar: num(r["outflow"]),
  }));
  map(ASET, "ASET", (r) => ({
    id: str(r["id"]),
    kode: str(r["asset_code"]),
    nama: str(r["name"]),
    kategori: str(r["category"]),
    lokasi: str(r["location"]),
    kondisi: str(r["condition_label"]),
    status: str(r["status"]),
    nilai: num(r["purchase_value"]),
  }));
  map(PEMINJAMAN_ASET, "PEMINJAMAN_ASET", (r) => ({
    id: str(r["id"]),
    aset: str(r["asset_name"]),
    peminjam: str(r["borrower"]),
    tanggal: date(r["loan_date"]),
    kembali: date(r["return_date"]),
    status: str(r["status"]),
  }));
  map(MAINTENANCE, "MAINTENANCE", (r) => ({
    id: str(r["id"]),
    aset: str(r["asset_name"]),
    jenis: str(r["kind"]),
    jadwal: date(r["scheduled_date"]),
    teknisi: str(r["technician"]),
    status: str(r["status"]),
  }));
  map(BUKU, "BUKU", (r) => ({
    id: str(r["id"]),
    isbn: str(r["isbn"]),
    judul: str(r["title"]),
    pengarang: str(r["author"]),
    kategori: str(r["category"]),
    stok: num(r["stock"]),
    tersedia: num(r["available"]),
  }));
  map(SIRKULASI, "SIRKULASI", (r) => ({
    id: str(r["id"]),
    buku: str(r["book_title"]),
    peminjam: str(r["borrower"]),
    kelas: str(r["class_name"]),
    pinjam: date(r["loan_date"]),
    jatuhTempo: date(r["due_date"]),
    status: str(r["status"]),
  }));
  map(KUNJUNGAN_UKS, "KUNJUNGAN_UKS", (r) => ({
    id: str(r["id"]),
    siswa: str(r["student_name"]),
    kelas: str(r["class_name"]),
    tanggal: date(r["visit_date"]),
    keluhan: str(r["complaint"]),
    tindakan: str(r["treatment"]),
    status: str(r["status"]),
  }));
  map(ANTROPOMETRI, "ANTROPOMETRI", (r) => ({
    kelas: str(r["class_name"]),
    rataTinggi: num(r["average_height"]),
    rataBerat: num(r["average_weight"]),
    statusGizi: str(r["nutrition_status"]),
    persenNormal: num(r["normal_percent"]),
  }));
  map(SCREENING, "SCREENING", (r) => ({
    jenis: str(r["kind"]),
    diperiksa: num(r["examined"]),
    temuan: num(r["findings"]),
  }));
  map(PENGUMUMAN, "PENGUMUMAN", (r) => ({
    id: str(r["id"]),
    judul: str(r["title"]),
    isi: str(r["body"]),
    target: str(r["target"]),
    tanggal: date(r["published_at"]),
    pengirim: str(r["author"]),
  }));
  map(NOTIFIKASI, "NOTIFIKASI", (r) => ({
    id: str(r["id"]),
    kanal: str(r["channel_name"]),
    penerima: str(r["recipient"]),
    isi: str(r["body"]),
    waktu: str(r["time_label"]),
    status: str(r["status"]),
  }));
  map(TAMU, "TAMU", (r) => ({
    id: str(r["id"]),
    nama: str(r["name"]),
    instansi: str(r["organization"]),
    keperluan: str(r["purpose"]),
    masuk: str(r["arrived_at"]),
    keluar: str(r["left_at"]),
    status: str(r["status"]),
  }));
  map(INSIDEN, "INSIDEN", (r) => ({
    id: str(r["id"]),
    waktu: str(r["occurred_at"]),
    jenis: str(r["kind"]),
    lokasi: str(r["location"]),
    sumber: str(r["source"]),
    tingkat: str(r["severity"]),
    status: str(r["status"]),
  }));
  map(PERANGKAT, "PERANGKAT", (r) => ({
    id: str(r["id"]),
    nama: str(r["name"]),
    tipe: str(r["type"]),
    lokasi: str(r["location"]),
    status: str(r["status"]),
    terakhir: str(r["last_seen_label"]),
  }));
  map(MATERI, "MATERI", (r) => ({
    id: str(r["id"]),
    judul: str(r["title"]),
    mapel: str(r["subject_name"]),
    kelasId: str(r["class_id"]),
    tipe: str(r["type"]),
    diakses: num(r["access_count"]),
  }));
  map(KUIS, "KUIS", (r) => ({
    id: str(r["id"]),
    judul: str(r["title"]),
    kelasId: str(r["class_id"]),
    soal: num(r["question_count"]),
    peserta: num(r["participant_count"]),
    rataRata: num(r["average_score"]),
    status: str(r["status"]),
  }));
  map(AUDIT_LOG, "AUDIT_LOG", (r) => ({
    id: str(r["id"]),
    waktu: str(r["occurred_at"]),
    aktor: str(r["actor"]),
    aksi: str(r["action_name"]),
    sebelum: str(r["before_value"]),
    sesudah: str(r["after_value"]),
    ip: str(r["ip_address"]),
  }));
  map(KPI_KATALOG, "KPI_KATALOG", (r) => ({
    id: str(r["id"]),
    nama: str(r["name"]),
    formula: str(r["formula"]),
    sumber: str(r["source"]),
    owner: str(r["owner_name"]),
    frekuensi: str(r["frequency"]),
    versi: str(r["version_label"]),
    nilai: str(r["display_value"]),
    target: str(r["target_value"]),
    status: str(r["status"]),
    refresh: str(r["refreshed_at"]),
  }));
  map(TREN_KPI, "TREN_KPI", (r) => ({
    periode: str(r["period_key"]),
    kehadiran: num(r["attendance"]),
    nilai: num(r["grade_average"]),
    serapan: num(r["budget_absorption"]),
  }));
  map(PERBANDINGAN_SEKOLAH, "PERBANDINGAN_SEKOLAH", (r) => ({
    sekolah: str(r["compared_school_name"]),
    kehadiran: num(r["attendance_percent"]),
    nilai: num(r["grade_average"]),
    serapan: num(r["budget_absorption"]),
    insiden: num(r["incident_count"]),
  }));
  map(KUALITAS_DATA, "KUALITAS_DATA", (r) => ({
    id: str(r["id"]),
    sumber: str(r["source"]),
    pemeriksaan: str(r["check_name"]),
    temuan: num(r["finding_count"]),
    ambang: num(r["threshold_count"]),
    status: str(r["status"]),
    terakhir: str(r["checked_at"]),
  }));
  map(LAPORAN_TERJADWAL, "LAPORAN_TERJADWAL", (r) => ({
    id: str(r["id"]),
    nama: str(r["name"]),
    format: str(r["format_name"]),
    jadwal: str(r["schedule_label"]),
    penerima: str(r["recipients"]),
    status: str(r["status"]),
    terakhir: str(r["last_run_at"]),
  }));
  map(INGESTION, "INGESTION", (r) => ({
    sumber: str(r["source"]),
    metode: str(r["method_name"]),
    event: num(r["event_count"]),
    jeda: str(r["lag_label"]),
    status: str(r["status"]),
  }));
  const integrationRows = raw["SISTEM_INTEGRASI"] ?? [];
  SISTEM_INTEGRASI.splice(
    0,
    SISTEM_INTEGRASI.length,
    ...integrationRows.map((r) => {
      const details = (
        typeof r["notes"] === "string" ? JSON.parse(r["notes"] || "{}") : (r["notes"] ?? {})
      ) as Partial<(typeof SISTEM_INTEGRASI)[number]>;
      return {
        id: str(r["id"]),
        nama: str(r["name"]),
        sumber: str(r["method_name"]),
        url: details.url ?? "",
        kategori: str(r["category"]),
        sinkronTerakhir: str(r["last_sync_label"]),
        status: str(r["status"]) as (typeof SISTEM_INTEGRASI)[number]["status"],
        utama: details.utama ?? { label: "", nilai: "" },
        indikator: details.indikator ?? [],
        kolom: details.kolom ?? [],
        baris: details.baris ?? [],
      };
    }),
  );
  jumlahDariCloud.guru = GURU.filter((r) => r.id.startsWith("DB-")).length;
  jumlahDariCloud.kelas = KELAS.filter((r) => !/^K[1-6]A$|^K1B$/.test(r.id)).length;
  jumlahDariCloud.siswa = SISWA.filter((r) => r.id.startsWith("DB-")).length;
  jumlahDariCloud.kehadiran = PRESENSI_HARI_INI.filter((r) => r.sumber === "Manual").length;
  version += 1;
  listeners.forEach((listener) => listener(version));
}

export function subscribeSchoolData(listener: (version: number) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function schoolDataVersion() {
  return version;
}
