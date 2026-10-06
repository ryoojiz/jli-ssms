/**
 * Struktur peran (RBAC) sisi antarmuka.
 * Sementara memakai data demo; begitu Lovable Cloud aktif, PERAN & izin
 * dipetakan langsung ke tabel `user_roles` tanpa mengubah komponen UI.
 */

export type Peran =
  | "kepala_sekolah"
  | "operator"
  | "guru"
  | "wali_kelas"
  | "bendahara"
  | "pustakawan"
  | "sarpras"
  | "uks"
  | "keamanan"
  | "walimurid"
  | "siswa"
  | "auditor";

/** Kunci modul = izin baca modul terkait. */
export type Modul =
  | "beranda"
  | "lokasi"
  | "analitik"
  | "akademik"
  | "kehadiran"
  | "keuangan"
  | "inventaris"
  | "perpustakaan"
  | "kesehatan"
  | "komunikasi"
  | "keamanan"
  | "kelas-digital"
  | "laporan"
  | "master-data";

export const SEMUA_MODUL: Modul[] = [
  "beranda",
  "lokasi",
  "analitik",
  "akademik",
  "kehadiran",
  "keuangan",
  "inventaris",
  "perpustakaan",
  "kesehatan",
  "komunikasi",
  "keamanan",
  "kelas-digital",
  "laporan",
  "master-data",
];

export const PERAN_LABEL: Record<Peran, string> = {
  kepala_sekolah: "Kepala Sekolah",
  operator: "Operator / Admin Sekolah",
  guru: "Guru Mata Pelajaran",
  wali_kelas: "Wali Kelas",
  bendahara: "Bendahara",
  pustakawan: "Pustakawan",
  sarpras: "Staf Sarana & Prasarana",
  uks: "Petugas UKS",
  keamanan: "Petugas Keamanan",
  walimurid: "Wali Murid",
  siswa: "Siswa",
  auditor: "Auditor (baca saja)",
};

export const PERAN_DESKRIPSI: Record<Peran, string> = {
  kepala_sekolah: "Akses penuh baca seluruh modul, persetujuan kebijakan & laporan.",
  operator: "Pengelola master data, akun, dan operasional harian sekolah.",
  guru: "Kelola jadwal, tugas, penilaian, dan kelas digital yang diampu.",
  wali_kelas: "Guru + rekap kehadiran, e-rapor, dan komunikasi wali murid kelasnya.",
  bendahara: "Pengelolaan RKAS, realisasi BOS, arus kas, dan bukti transaksi.",
  pustakawan: "Katalog dan sirkulasi perpustakaan.",
  sarpras: "Aset, peminjaman, dan pemeliharaan inventaris.",
  uks: "Rekam kesehatan, screening, dan antropometri siswa.",
  keamanan: "Monitoring CCTV, smart gate, buku tamu, dan insiden.",
  walimurid: "Melihat data anak: akademik, kehadiran, kesehatan, pengumuman.",
  siswa: "Melihat jadwal, tugas, nilai, materi, dan kuis pribadi.",
  auditor: "Akses baca saja seluruh modul termasuk audit trail.",
};

/** Izin baca per peran (menu yang tampil di sidebar). */
export const IZIN: Record<Peran, Modul[]> = {
  kepala_sekolah: SEMUA_MODUL,
  operator: SEMUA_MODUL,
  auditor: SEMUA_MODUL,
  guru: ["beranda", "lokasi", "akademik", "kehadiran", "kelas-digital", "komunikasi"],
  wali_kelas: [
    "beranda",
    "lokasi",
    "akademik",
    "kehadiran",
    "kesehatan",
    "kelas-digital",
    "komunikasi",
    "analitik",
  ],
  bendahara: ["beranda", "lokasi", "keuangan", "inventaris", "analitik", "komunikasi", "laporan"],
  pustakawan: ["beranda", "lokasi", "perpustakaan", "komunikasi"],
  sarpras: ["beranda", "lokasi", "inventaris", "keamanan", "komunikasi"],
  uks: ["beranda", "lokasi", "kesehatan", "kehadiran", "komunikasi"],
  keamanan: ["beranda", "lokasi", "keamanan", "komunikasi"],
  walimurid: ["beranda", "akademik", "kehadiran", "kesehatan", "perpustakaan", "komunikasi"],
  siswa: ["beranda", "lokasi", "akademik", "kehadiran", "kelas-digital", "perpustakaan", "komunikasi"],
};

/** Peran yang boleh melakukan perubahan data (tulis) pada modul yang diizinkan. */
export const PERAN_HANYA_BACA: Peran[] = ["auditor", "walimurid", "siswa", "kepala_sekolah"];

export function bolehAkses(peran: Peran, modul: Modul) {
  return IZIN[peran].includes(modul);
}

export function bolehUbah(peran: Peran, modul: Modul) {
  return bolehAkses(peran, modul) && !PERAN_HANYA_BACA.includes(peran);
}

export type Sesi = {
  nama: string;
  email: string;
  peran: Peran;
  /** Konteks tambahan, mis. kelas wali kelas atau nama anak untuk wali murid. */
  konteks?: string;
  /** ID anak terkait untuk akun wali murid/siswa pada data demo. */
  siswaId?: string;
};

/** Akun demo untuk mencoba tiap peran sebelum Lovable Cloud aktif. */
export const AKUN_DEMO: Array<Sesi & { kataSandi: string }> = [
  { nama: "Yulia Kratiningsih S.Pd", email: "kepsek@sdn01.sch.id", peran: "kepala_sekolah", kataSandi: "demo1234" },
  { nama: "Rizky Ananda", email: "operator@sdn01.sch.id", peran: "operator", kataSandi: "demo1234" },
  { nama: "Budi Santoso, S.Pd.", email: "guru@sdn01.sch.id", peran: "guru", kataSandi: "demo1234", konteks: "Matematika" },
  { nama: "Siti Rahmawati, S.Pd.", email: "walikelas@sdn01.sch.id", peran: "wali_kelas", kataSandi: "demo1234", konteks: "Kelas 5A" },
  { nama: "Hendra Kurniawan", email: "bendahara@sdn01.sch.id", peran: "bendahara", kataSandi: "demo1234" },
  { nama: "Maya Puspita", email: "pustakawan@sdn01.sch.id", peran: "pustakawan", kataSandi: "demo1234" },
  { nama: "Agus Setiawan", email: "sarpras@sdn01.sch.id", peran: "sarpras", kataSandi: "demo1234" },
  { nama: "Ns. Dewi Lestari", email: "uks@sdn01.sch.id", peran: "uks", kataSandi: "demo1234" },
  { nama: "Joko Prasetyo", email: "keamanan@sdn01.sch.id", peran: "keamanan", kataSandi: "demo1234" },
  { nama: "Ibu Ratna (Wali Aisyah)", email: "walimurid@gmail.com", peran: "walimurid", kataSandi: "demo1234", konteks: "Aisyah Putri — 5A", siswaId: "K5A-S01" },
  { nama: "Aisyah Putri", email: "siswa@sdn01.sch.id", peran: "siswa", kataSandi: "demo1234", konteks: "Kelas 5A", siswaId: "K5A-S01" },
  { nama: "Inspektorat Dinas", email: "auditor@jakarta.go.id", peran: "auditor", kataSandi: "demo1234" },
];

export function inisial(nama: string) {
  return nama
    .replace(/[^\p{L}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}
