/** Daftar peran untuk navigasi; otorisasi mutasi ditegakkan kembali di server. */

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
  guru: [
    "beranda",
    "lokasi",
    "akademik",
    "kehadiran",
    "perpustakaan",
    "kelas-digital",
    "komunikasi",
  ],
  wali_kelas: [
    "beranda",
    "lokasi",
    "akademik",
    "kehadiran",
    "perpustakaan",
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
  siswa: [
    "beranda",
    "lokasi",
    "akademik",
    "kehadiran",
    "kelas-digital",
    "perpustakaan",
    "komunikasi",
  ],
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
  /** ID siswa yang ditautkan ke akun wali murid/siswa. */
  siswaId?: string;
  /** ID guru yang ditautkan ke keanggotaan sekolah. */
  guruId?: string;
  classId?: string;
  schoolId?: string;
  schoolName?: string;
  schoolNpsn?: string;
  schoolAddress?: string;
  academicYear?: string;
  semester?: string;
  schools?: Array<{ id: string; name: string }>;
};

export function inisial(nama: string) {
  return nama
    .replace(/[^\p{L}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}
