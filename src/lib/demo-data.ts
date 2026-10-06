/**
 * Data operasional contoh untuk School Management System (SMS).
 * Deterministik (tanpa random/IO) agar aman untuk SSR.
 * Nantinya lapisan ini diganti query Lovable Cloud tanpa mengubah UI.
 */

export const SCHOOL = {
  id: "SDN-KBG-01",
  nama: "SDN Kebagusan 01 Pagi",
  npsn: "20105987",
  alamat:
    "Jl. Raya Kebagusan RT.004/RW.07, Kelurahan Kebagusan, Kecamatan Pasar Minggu, Kota Administrasi Jakarta Selatan, DKI Jakarta",
  alamatSingkat: "Jl. Raya Kebagusan, Kec. Pasar Minggu, Jakarta Selatan",

  koordinat: { latitude: -6.316066, longitude: 106.8255336 },
  kepalaSekolah: "Yulia Kratiningsih S.Pd",
  tahunAjaran: "2026/2027",
  semester: "Ganjil",
};

export const SEKOLAH_LOKASI = [
  SCHOOL,
  {
    id: "SDN-JKT-02",
    nama: "SD Negeri Cikini 02 Jakarta",
    npsn: "20100214",
    alamat: "Jl. Cikini IV, Menteng, Jakarta Pusat",
    koordinat: { latitude: -6.19235, longitude: 106.84091 },
  },
  {
    id: "SDN-JKT-03",
    nama: "SD Negeri Gondangdia 01 Jakarta",
    npsn: "20100308",
    alamat: "Jl. Probolinggo, Menteng, Jakarta Pusat",
    koordinat: { latitude: -6.18821, longitude: 106.83296 },
  },
  {
    id: "SMPN-JKT-01",
    nama: "SMP Negeri 1 Jakarta",
    npsn: "20100001",
    alamat: "Jl. Cikini Raya, Menteng, Jakarta Pusat",
    koordinat: { latitude: -6.19436, longitude: 106.83917 },
  },
  {
    id: "SDN-MGR-09",
    nama: "SDN 09 Manggarai",
    npsn: "—",
    alamat: "Jl. Manggarai Selatan II, Manggarai, Tebet, Jakarta Selatan, DKI Jakarta",
    koordinat: { latitude: -6.215748, longitude: 106.8543488 },
    kepalaSekolah: "Diah Zen",
  },
] as const;

/* ---------- util deterministik ---------- */
function seeded(n: number, mod: number) {
  return (n * 9301 + 49297) % 233280 % mod;
}

export const NAMA_DEPAN = [
  "Aisyah", "Bagas", "Citra", "Dimas", "Elang", "Fadhil", "Gita", "Hafiz",
  "Intan", "Joko", "Kirana", "Lutfi", "Maya", "Naufal", "Oktaviani", "Putra",
  "Qonita", "Rizky", "Salsabila", "Tegar", "Umar", "Vina", "Wahyu", "Yasmin",
];
const NAMA_BELAKANG = [
  "Pratama", "Ramadhan", "Wijaya", "Nugroho", "Lestari", "Saputra", "Halim",
  "Kusuma", "Anggraini", "Setiawan", "Maharani", "Firdaus",
];

export type Kelas = {
  id: string;
  nama: string;
  tingkat: number;
  waliKelas: string;
  ruang: string;
  jumlahSiswa: number;
};

export const KELAS: Kelas[] = [
  { id: "K1A", nama: "1A", tingkat: 1, waliKelas: "Rina Marlina, S.Pd.", ruang: "R-101", jumlahSiswa: 28 },
  { id: "K1B", nama: "1B", tingkat: 1, waliKelas: "Dewi Anjani, S.Pd.", ruang: "R-102", jumlahSiswa: 27 },
  { id: "K2A", nama: "2A", tingkat: 2, waliKelas: "Bambang Sutrisno, S.Pd.", ruang: "R-201", jumlahSiswa: 30 },
  { id: "K3A", nama: "3A", tingkat: 3, waliKelas: "Nurul Hidayah, S.Pd.", ruang: "R-202", jumlahSiswa: 29 },
  { id: "K4A", nama: "4A", tingkat: 4, waliKelas: "Agus Salim, S.Pd.", ruang: "R-301", jumlahSiswa: 31 },
  { id: "K5A", nama: "5A", tingkat: 5, waliKelas: "Siti Rohmah, S.Pd.", ruang: "R-302", jumlahSiswa: 30 },
  { id: "K6A", nama: "6A", tingkat: 6, waliKelas: "Hendra Gunawan, S.Pd.", ruang: "R-401", jumlahSiswa: 28 },
];

export type Siswa = {
  id: string;
  nisn: string;
  nama: string;
  kelasId: string;
  jenisKelamin: "L" | "P";
  namaWali: string;
  telpWali: string;
  tagUid: string;
};

export const SISWA: Siswa[] = KELAS.flatMap((k, ki) =>
  Array.from({ length: 12 }, (_, i) => {
    const idx = ki * 12 + i;
    const depan = NAMA_DEPAN[seeded(idx + 3, NAMA_DEPAN.length)]!;
    const belakang = NAMA_BELAKANG[seeded(idx + 11, NAMA_BELAKANG.length)]!;
    return {
      id: `${k.id}-S${String(i + 1).padStart(2, "0")}`,
      nisn: String(3120000000 + idx * 137),
      nama: k.id === "K5A" && i === 0 ? "Aisyah Putri" : `${depan} ${belakang}`,
      kelasId: k.id,
      jenisKelamin: idx % 2 === 0 ? ("P" as const) : ("L" as const),
      namaWali: `${NAMA_BELAKANG[seeded(idx + 5, NAMA_BELAKANG.length)]!} (Ortu)`,
      telpWali: `0812${String(10000000 + idx * 4321).slice(0, 8)}`,
      tagUid: `RF-${(1000 + idx * 7).toString(16).toUpperCase()}`,
    };
  }),
);

export type Guru = {
  id: string;
  nip: string;
  nama: string;
  mapel: string;
  status: "PNS" | "PPPK" | "Honorer";
};

export const GURU: Guru[] = [
  { id: "G01", nip: "197803122005012001", nama: "Rina Marlina, S.Pd.", mapel: "Guru Kelas 1", status: "PNS" },
  { id: "G02", nip: "198205172008012004", nama: "Dewi Anjani, S.Pd.", mapel: "Guru Kelas 1", status: "PNS" },
  { id: "G03", nip: "197501102003121002", nama: "Bambang Sutrisno, S.Pd.", mapel: "Guru Kelas 2", status: "PNS" },
  { id: "G04", nip: "198809232014032005", nama: "Nurul Hidayah, S.Pd.", mapel: "Guru Kelas 3", status: "PPPK" },
  { id: "G05", nip: "198412052010011003", nama: "Agus Salim, S.Pd.", mapel: "Guru Kelas 4", status: "PNS" },
  { id: "G06", nip: "199003142016032001", nama: "Siti Rohmah, S.Pd.", mapel: "Guru Kelas 5", status: "PPPK" },
  { id: "G07", nip: "198107182006041002", nama: "Hendra Gunawan, S.Pd.", mapel: "Guru Kelas 6", status: "PNS" },
  { id: "G08", nip: "-", nama: "Yulianto, S.Pd.", mapel: "PJOK", status: "Honorer" },
  { id: "G09", nip: "-", nama: "Fitriani, S.Ag.", mapel: "PAI & Budi Pekerti", status: "Honorer" },
  { id: "G10", nip: "199511022019022003", nama: "Larasati, S.Pd.", mapel: "Bahasa Inggris", status: "PPPK" },
];

export const MAPEL = [
  "Bahasa Indonesia",
  "Matematika",
  "IPAS",
  "PPKn",
  "PAI & Budi Pekerti",
  "PJOK",
  "Seni Budaya",
  "Bahasa Inggris",
];

export const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;

export type Jadwal = {
  id: string;
  hari: (typeof HARI)[number];
  jamMulai: string;
  jamSelesai: string;
  kelasId: string;
  mapel: string;
  guru: string;
  ruang: string;
};

const JAM = [
  ["07:00", "08:10"],
  ["08:10", "09:20"],
  ["09:40", "10:50"],
  ["10:50", "12:00"],
];

export const JADWAL: Jadwal[] = KELAS.flatMap((k, ki) =>
  HARI.flatMap((hari, hi) =>
    JAM.map(([mulai, selesai], ji) => {
      const idx = ki * 20 + hi * 4 + ji;
      return {
        id: `J-${idx}`,
        hari,
        jamMulai: mulai!,
        jamSelesai: selesai!,
        kelasId: k.id,
        mapel: MAPEL[seeded(idx + 2, MAPEL.length)]!,
        guru: GURU[seeded(idx + 6, GURU.length)]!.nama,
        ruang: k.ruang,
      };
    }),
  ),
);

export type Tugas = {
  id: string;
  judul: string;
  kelasId: string;
  mapel: string;
  tenggat: string;
  dikumpulkan: number;
  total: number;
  status: "Aktif" | "Selesai" | "Draft";
};

export const TUGAS: Tugas[] = [
  { id: "T-01", judul: "Latihan Pecahan Senilai", kelasId: "K5A", mapel: "Matematika", tenggat: "2026-09-08", dikumpulkan: 24, total: 30, status: "Aktif" },
  { id: "T-02", judul: "Menulis Teks Deskripsi", kelasId: "K4A", mapel: "Bahasa Indonesia", tenggat: "2026-09-06", dikumpulkan: 31, total: 31, status: "Selesai" },
  { id: "T-03", judul: "Observasi Siklus Air", kelasId: "K6A", mapel: "IPAS", tenggat: "2026-09-11", dikumpulkan: 12, total: 28, status: "Aktif" },
  { id: "T-04", judul: "Hafalan Surat Pendek", kelasId: "K3A", mapel: "PAI & Budi Pekerti", tenggat: "2026-09-12", dikumpulkan: 9, total: 29, status: "Aktif" },
  { id: "T-05", judul: "Poster Hidup Sehat", kelasId: "K2A", mapel: "PJOK", tenggat: "2026-09-15", dikumpulkan: 0, total: 30, status: "Draft" },
];

export type Ujian = {
  id: string;
  nama: string;
  mapel: string;
  kelasId: string;
  tanggal: string;
  jenis: "Sumatif" | "Formatif" | "PTS" | "PAS";
};

export const UJIAN: Ujian[] = [
  { id: "U-01", nama: "Sumatif Bab 1", mapel: "Matematika", kelasId: "K5A", tanggal: "2026-09-15", jenis: "Sumatif" },
  { id: "U-02", nama: "Formatif Teks Deskripsi", mapel: "Bahasa Indonesia", kelasId: "K4A", tanggal: "2026-09-09", jenis: "Formatif" },
  { id: "U-03", nama: "Penilaian Tengah Semester", mapel: "IPAS", kelasId: "K6A", tanggal: "2026-09-29", jenis: "PTS" },
  { id: "U-04", nama: "Formatif Bilangan", mapel: "Matematika", kelasId: "K3A", tanggal: "2026-09-10", jenis: "Formatif" },
];

export type Nilai = { siswaId: string; mapel: string; nilai: number };

export const NILAI: Nilai[] = SISWA.flatMap((s, si) =>
  MAPEL.slice(0, 5).map((m, mi) => ({
    siswaId: s.id,
    mapel: m,
    nilai: 62 + seeded(si * 7 + mi * 13 + 1, 38),
  })),
);

export function rataRataSiswa(siswaId: string) {
  const n = NILAI.filter((x) => x.siswaId === siswaId);
  if (!n.length) return 0;
  return Math.round(n.reduce((a, b) => a + b.nilai, 0) / n.length);
}

export const DISTRIBUSI_NILAI = [
  { rentang: "< 70", jumlah: NILAI.filter((n) => n.nilai < 70).length },
  { rentang: "70–79", jumlah: NILAI.filter((n) => n.nilai >= 70 && n.nilai < 80).length },
  { rentang: "80–89", jumlah: NILAI.filter((n) => n.nilai >= 80 && n.nilai < 90).length },
  { rentang: "≥ 90", jumlah: NILAI.filter((n) => n.nilai >= 90).length },
];

/* ---------- Kehadiran ---------- */
export const STATUS_HADIR = ["Hadir", "Terlambat", "Izin", "Sakit", "Alfa"] as const;
export type StatusHadir = (typeof STATUS_HADIR)[number];

export type Presensi = {
  siswaId: string;
  tanggal: string;
  status: StatusHadir;
  jam: string;
  sumber: "QR" | "RFID" | "Face" | "Manual";
};

const HARI_INI = "2026-09-04";

export const PRESENSI_HARI_INI: Presensi[] = SISWA.map((s, i) => {
  const r = seeded(i * 3 + 17, 100);
  const status: StatusHadir =
    r < 84 ? "Hadir" : r < 90 ? "Terlambat" : r < 94 ? "Izin" : r < 97 ? "Sakit" : "Alfa";
  return {
    siswaId: s.id,
    tanggal: HARI_INI,
    status,
    jam: status === "Terlambat" ? "07:2" + (i % 10) : status === "Hadir" ? "06:5" + (i % 10) : "-",
    sumber: (["QR", "RFID", "Face", "Manual"] as const)[i % 4]!,
  };
});

export function rekapPresensi(list: Presensi[] = PRESENSI_HARI_INI) {
  return STATUS_HADIR.map((s) => ({
    status: s,
    jumlah: list.filter((p) => p.status === s).length,
  }));
}

export const TREN_KEHADIRAN = [
  { hari: "Sen", persen: 95.2 },
  { hari: "Sel", persen: 93.8 },
  { hari: "Rab", persen: 96.4 },
  { hari: "Kam", persen: 92.1 },
  { hari: "Jum", persen: 94.6 },
];

export const IZIN = [
  { id: "IZ-01", siswa: "Kirana Lestari", kelas: "5A", jenis: "Sakit", tanggal: "2026-09-04", keterangan: "Demam, surat dokter terlampir", status: "Disetujui" },
  { id: "IZ-02", siswa: "Dimas Nugroho", kelas: "4A", jenis: "Izin", tanggal: "2026-09-04", keterangan: "Acara keluarga", status: "Menunggu" },
  { id: "IZ-03", siswa: "Yasmin Halim", kelas: "6A", jenis: "Sakit", tanggal: "2026-09-03", keterangan: "Kontrol gigi", status: "Disetujui" },
  { id: "IZ-04", siswa: "Bagas Saputra", kelas: "3A", jenis: "Izin", tanggal: "2026-09-05", keterangan: "Lomba renang O2SN", status: "Menunggu" },
];

/* ---------- Keuangan ---------- */
export const ANGGARAN = [
  { id: "A-01", kode: "BOS-01", program: "Pengembangan Perpustakaan", pagu: 42000000, realisasi: 28500000 },
  { id: "A-02", kode: "BOS-02", program: "Kegiatan Pembelajaran & Ekstrakurikuler", pagu: 68000000, realisasi: 51200000 },
  { id: "A-03", kode: "BOS-03", program: "Administrasi Sekolah", pagu: 24000000, realisasi: 19800000 },
  { id: "A-04", kode: "BOS-04", program: "Pemeliharaan Sarana Prasarana", pagu: 55000000, realisasi: 22400000 },
  { id: "A-05", kode: "BOS-05", program: "Langganan Daya & Jasa", pagu: 30000000, realisasi: 24900000 },
];

export const TRANSAKSI = [
  { id: "TRX-1041", tanggal: "2026-09-03", uraian: "Pembelian buku pengayaan literasi", kategori: "BOS-01", jenis: "Pengeluaran", nominal: 4750000, status: "Disetujui" },
  { id: "TRX-1042", tanggal: "2026-09-03", uraian: "Penerimaan dana BOS Tahap 2", kategori: "BOS-00", jenis: "Pemasukan", nominal: 120000000, status: "Disetujui" },
  { id: "TRX-1043", tanggal: "2026-09-02", uraian: "Servis AC ruang kelas 4A–6A", kategori: "BOS-04", jenis: "Pengeluaran", nominal: 3200000, status: "Menunggu" },
  { id: "TRX-1044", tanggal: "2026-09-02", uraian: "Tagihan listrik Agustus", kategori: "BOS-05", jenis: "Pengeluaran", nominal: 5410000, status: "Disetujui" },
  { id: "TRX-1045", tanggal: "2026-09-01", uraian: "Konsumsi rapat komite", kategori: "BOS-03", jenis: "Pengeluaran", nominal: 1850000, status: "Ditolak" },
  { id: "TRX-1046", tanggal: "2026-09-01", uraian: "Honor pelatih ekskul pramuka", kategori: "BOS-02", jenis: "Pengeluaran", nominal: 2400000, status: "Menunggu" },
];

export const ARUS_KAS = [
  { bulan: "Apr", masuk: 95, keluar: 71 },
  { bulan: "Mei", masuk: 88, keluar: 79 },
  { bulan: "Jun", masuk: 102, keluar: 84 },
  { bulan: "Jul", masuk: 76, keluar: 62 },
  { bulan: "Agu", masuk: 110, keluar: 93 },
  { bulan: "Sep", masuk: 120, keluar: 41 },
];

/* ---------- Inventaris ---------- */
export const ASET = [
  { id: "AS-0001", kode: "INV/PRJ/001", nama: "Proyektor Epson EB-X06", kategori: "Elektronik", lokasi: "R-401", kondisi: "Baik", status: "Tersedia", nilai: 6500000 },
  { id: "AS-0002", kode: "INV/LPT/014", nama: "Laptop Chromebook Acer", kategori: "Elektronik", lokasi: "Lab Komputer", kondisi: "Baik", status: "Dipinjam", nilai: 4200000 },
  { id: "AS-0003", kode: "INV/MJA/220", nama: "Meja Siswa Kayu", kategori: "Furnitur", lokasi: "R-201", kondisi: "Rusak Ringan", status: "Perbaikan", nilai: 450000 },
  { id: "AS-0004", kode: "INV/SND/003", nama: "Sound System Portable", kategori: "Elektronik", lokasi: "Aula", kondisi: "Baik", status: "Tersedia", nilai: 8900000 },
  { id: "AS-0005", kode: "INV/AC/009", nama: "AC Split 1PK Daikin", kategori: "Elektronik", lokasi: "R-302", kondisi: "Rusak Berat", status: "Perbaikan", nilai: 5100000 },
  { id: "AS-0006", kode: "INV/PRT/002", nama: "Printer Laser Brother", kategori: "Elektronik", lokasi: "Tata Usaha", kondisi: "Baik", status: "Tersedia", nilai: 3300000 },
];

export const PEMINJAMAN_ASET = [
  { id: "PA-11", aset: "Laptop Chromebook Acer", peminjam: "Agus Salim, S.Pd.", tanggal: "2026-09-02", kembali: "2026-09-06", status: "Berjalan" },
  { id: "PA-12", aset: "Sound System Portable", peminjam: "Panitia HUT Sekolah", tanggal: "2026-08-28", kembali: "2026-08-30", status: "Selesai" },
  { id: "PA-13", aset: "Proyektor Epson EB-X06", peminjam: "Siti Rohmah, S.Pd.", tanggal: "2026-09-01", kembali: "2026-09-01", status: "Terlambat" },
];

export const MAINTENANCE = [
  { id: "MT-05", aset: "AC Split 1PK Daikin", jenis: "Perbaikan", jadwal: "2026-09-08", teknisi: "CV Sejuk Abadi", status: "Dijadwalkan" },
  { id: "MT-06", aset: "Meja Siswa Kayu", jenis: "Perawatan", jadwal: "2026-09-12", teknisi: "Internal", status: "Dijadwalkan" },
  { id: "MT-04", aset: "Proyektor Epson EB-X06", jenis: "Kalibrasi", jadwal: "2026-08-20", teknisi: "PT Visual Prima", status: "Selesai" },
];

/* ---------- Perpustakaan ---------- */
export const BUKU = [
  { id: "B-001", isbn: "978-602-1234-01", judul: "Ensiklopedia Sains Anak", pengarang: "Tim Cendekia", kategori: "Referensi", stok: 12, tersedia: 9 },
  { id: "B-002", isbn: "978-602-1234-02", judul: "Kumpulan Dongeng Nusantara", pengarang: "R. Sudarmawan", kategori: "Fiksi", stok: 20, tersedia: 14 },
  { id: "B-003", isbn: "978-602-1234-03", judul: "Matematika Menyenangkan Kelas 5", pengarang: "Dwi Hastuti", kategori: "Pelajaran", stok: 35, tersedia: 21 },
  { id: "B-004", isbn: "978-602-1234-04", judul: "Atlas Indonesia & Dunia", pengarang: "Balai Pustaka", kategori: "Referensi", stok: 8, tersedia: 8 },
  { id: "B-005", isbn: "978-602-1234-05", judul: "Cerita Pahlawan Nasional", pengarang: "Siti Nurbaya", kategori: "Sejarah", stok: 15, tersedia: 10 },
];

export const SIRKULASI = [
  { id: "SR-201", buku: "Kumpulan Dongeng Nusantara", peminjam: "Aisyah Putri", kelas: "5A", pinjam: "2026-08-29", jatuhTempo: "2026-09-05", status: "Berjalan" },
  { id: "SR-202", buku: "Matematika Menyenangkan Kelas 5", peminjam: "Rizky Wijaya", kelas: "5A", pinjam: "2026-08-20", jatuhTempo: "2026-08-27", status: "Terlambat" },
  { id: "SR-203", buku: "Ensiklopedia Sains Anak", peminjam: "Gita Kusuma", kelas: "6A", pinjam: "2026-09-01", jatuhTempo: "2026-09-08", status: "Berjalan" },
  { id: "SR-204", buku: "Cerita Pahlawan Nasional", peminjam: "Naufal Halim", kelas: "3A", pinjam: "2026-08-15", jatuhTempo: "2026-08-22", status: "Dikembalikan" },
];

/* ---------- Kesehatan (UKS) ---------- */
export const KUNJUNGAN_UKS = [
  { id: "UKS-30", siswa: "Aisyah Putri", kelas: "5A", tanggal: "2026-08-21", keluhan: "Pusing ringan", tindakan: "Istirahat dan observasi", status: "Selesai" },
  { id: "UKS-31", siswa: "Dimas Nugroho", kelas: "4A", tanggal: "2026-09-04", keluhan: "Pusing setelah upacara", tindakan: "Istirahat + minum air", status: "Selesai" },
  { id: "UKS-32", siswa: "Salsabila Anggraini", kelas: "2A", tanggal: "2026-09-04", keluhan: "Luka lecet di lutut", tindakan: "Bersihkan luka, plester", status: "Selesai" },
  { id: "UKS-33", siswa: "Tegar Firdaus", kelas: "6A", tanggal: "2026-09-03", keluhan: "Demam 38.5°C", tindakan: "Rujuk ke Puskesmas", status: "Rujukan" },
];

export const ANTROPOMETRI = [
  { kelas: "1A", rataTinggi: 118, rataBerat: 22, statusGizi: "Normal", persenNormal: 86 },
  { kelas: "2A", rataTinggi: 124, rataBerat: 25, statusGizi: "Normal", persenNormal: 82 },
  { kelas: "3A", rataTinggi: 129, rataBerat: 28, statusGizi: "Normal", persenNormal: 79 },
  { kelas: "4A", rataTinggi: 135, rataBerat: 32, statusGizi: "Perlu perhatian", persenNormal: 74 },
  { kelas: "5A", rataTinggi: 141, rataBerat: 36, statusGizi: "Normal", persenNormal: 81 },
  { kelas: "6A", rataTinggi: 147, rataBerat: 41, statusGizi: "Normal", persenNormal: 84 },
];

export const SCREENING = [
  { jenis: "Penglihatan", diperiksa: 198, temuan: 17 },
  { jenis: "Pendengaran", diperiksa: 198, temuan: 5 },
  { jenis: "Gigi & Mulut", diperiksa: 186, temuan: 43 },
  { jenis: "Status Gizi", diperiksa: 198, temuan: 21 },
];

/* ---------- Komunikasi ---------- */
export const PENGUMUMAN = [
  { id: "PG-77", judul: "Pekan Penilaian Tengah Semester", isi: "PTS dilaksanakan 29 Sept – 3 Okt 2026. Jadwal per kelas dapat dilihat di menu Akademik.", target: "Semua", tanggal: "2026-09-04", pengirim: "Kepala Sekolah" },
  { id: "PG-76", judul: "Pemeriksaan Kesehatan Berkala", isi: "Petugas Puskesmas akan melakukan screening pada 10 September untuk kelas 1–3.", target: "Kelas 1-3", tanggal: "2026-09-03", pengirim: "UKS" },
  { id: "PG-75", judul: "Pembayaran Kegiatan Ekskul", isi: "Iuran kegiatan ekstrakurikuler semester ganjil dapat dibayarkan melalui bendahara sekolah.", target: "Orang Tua", tanggal: "2026-09-01", pengirim: "Bendahara" },
];

export const NOTIFIKASI = [
  { id: "NT-901", kanal: "WhatsApp", penerima: "Wali Kirana Lestari (5A)", isi: "Ananda tercatat SAKIT hari ini.", waktu: "07:12", status: "Terkirim" },
  { id: "NT-902", kanal: "Push", penerima: "Wali Bagas Saputra (3A)", isi: "Ananda tercatat TERLAMBAT pukul 07:24.", waktu: "07:25", status: "Terkirim" },
  { id: "NT-903", kanal: "WhatsApp", penerima: "Wali Umar Setiawan (2A)", isi: "Ananda tercatat ALFA hari ini.", waktu: "08:05", status: "Gagal" },
  { id: "NT-904", kanal: "Email", penerima: "Komite Sekolah", isi: "Undangan rapat evaluasi triwulan.", waktu: "09:30", status: "Terkirim" },
];

/* ---------- Smart Security ---------- */
export const TAMU = [
  { id: "VS-120", nama: "Andi Prasetyo", instansi: "Dinas Pendidikan DKI", keperluan: "Monitoring program", masuk: "08:15", keluar: "-", status: "Di dalam" },
  { id: "VS-119", nama: "Rina Oktaviani", instansi: "Orang tua siswa 3A", keperluan: "Menjemput anak sakit", masuk: "09:40", keluar: "10:05", status: "Selesai" },
  { id: "VS-118", nama: "CV Sejuk Abadi", instansi: "Vendor", keperluan: "Servis AC", masuk: "07:50", keluar: "-", status: "Di dalam" },
];

export const INSIDEN = [
  { id: "IC-14", waktu: "2026-09-04 09:52", jenis: "Loitering terdeteksi", lokasi: "Gerbang Belakang", sumber: "CCTV AI", tingkat: "Sedang", status: "Terbuka" },
  { id: "IC-13", waktu: "2026-09-03 13:20", jenis: "Panic button ditekan", lokasi: "Kantin", sumber: "Panic Button", tingkat: "Tinggi", status: "Ditangani" },
  { id: "IC-12", waktu: "2026-09-02 15:05", jenis: "Gerbang terbuka di luar jadwal", lokasi: "Smart Gate Utama", sumber: "Smart Gate", tingkat: "Rendah", status: "Selesai" },
];

export const PERANGKAT = [
  { id: "DV-01", nama: "CCTV Gerbang Utama", tipe: "CCTV", lokasi: "Gerbang Utama", status: "Online", terakhir: "1 menit lalu" },
  { id: "DV-02", nama: "CCTV Koridor Lt.2", tipe: "CCTV", lokasi: "Koridor 2", status: "Online", terakhir: "1 menit lalu" },
  { id: "DV-03", nama: "Smart Gate Utama", tipe: "Gate", lokasi: "Gerbang Utama", status: "Online", terakhir: "baru saja" },
  { id: "DV-04", nama: "Reader RFID Kelas 5A", tipe: "RFID", lokasi: "R-302", status: "Offline", terakhir: "2 jam lalu" },
  { id: "DV-05", nama: "Panic Button Kantin", tipe: "Panic", lokasi: "Kantin", status: "Online", terakhir: "5 menit lalu" },
  { id: "DV-06", nama: "Papan Interaktif 6A", tipe: "Display", lokasi: "R-401", status: "Online", terakhir: "3 menit lalu" },
  { id: "DV-07", nama: "Sensor Suhu Lab", tipe: "Sensor", lokasi: "Lab Komputer", status: "Perlu Perhatian", terakhir: "12 menit lalu" },
];

/* ---------- Smart Classroom ---------- */
export const MATERI = [
  { id: "MD-21", judul: "Video: Siklus Air", mapel: "IPAS", kelasId: "K6A", tipe: "Video", diakses: 24 },
  { id: "MD-22", judul: "Modul PDF: Pecahan Senilai", mapel: "Matematika", kelasId: "K5A", tipe: "PDF", diakses: 30 },
  { id: "MD-23", judul: "Slide: Teks Deskripsi", mapel: "Bahasa Indonesia", kelasId: "K4A", tipe: "Slide", diakses: 28 },
  { id: "MD-24", judul: "Audio: Pelafalan Bahasa Inggris", mapel: "Bahasa Inggris", kelasId: "K3A", tipe: "Audio", diakses: 19 },
];

export const KUIS = [
  { id: "KZ-08", judul: "Kuis Cepat Pecahan", kelasId: "K5A", soal: 10, peserta: 28, rataRata: 82, status: "Selesai" },
  { id: "KZ-09", judul: "Kuis Siklus Air", kelasId: "K6A", soal: 8, peserta: 15, rataRata: 76, status: "Berjalan" },
  { id: "KZ-10", judul: "Kuis Kosakata Harian", kelasId: "K3A", soal: 12, peserta: 0, rataRata: 0, status: "Terjadwal" },
];

/* ---------- Audit ---------- */
export const AUDIT_LOG = [
  { id: "AL-5011", waktu: "2026-09-04 09:41", aktor: "bendahara@sdn01.sch.id", aksi: "UPDATE transaksi TRX-1043", sebelum: "status=Draft", sesudah: "status=Menunggu", ip: "10.12.4.21" },
  { id: "AL-5010", waktu: "2026-09-04 08:12", aktor: "guru.agus@sdn01.sch.id", aksi: "INSERT presensi kelas 4A", sebelum: "-", sesudah: "31 baris", ip: "10.12.4.55" },
  { id: "AL-5009", waktu: "2026-09-04 07:05", aktor: "operator@sdn01.sch.id", aksi: "UPDATE siswa K3A-S04", sebelum: "telp=0812xxxx1", sesudah: "telp=0812xxxx9", ip: "10.12.4.10" },
  { id: "AL-5008", waktu: "2026-09-03 16:40", aktor: "kepsek@sdn01.sch.id", aksi: "APPROVE anggaran BOS-04", sebelum: "pagu=50.000.000", sesudah: "pagu=55.000.000", ip: "10.12.4.2" },
];

export const PERAN = [
  { peran: "Dinas Pendidikan", cakupan: "Multi-sekolah", hak: "Monitoring, master data, kebijakan, analitik, audit" },
  { peran: "Kepala Sekolah", cakupan: "1 sekolah", hak: "Persetujuan, monitoring, dashboard, pengawasan insiden" },
  { peran: "Guru", cakupan: "Kelas/mapel diampu", hak: "Akademik, kehadiran, komunikasi, kelas digital" },
  { peran: "Siswa", cakupan: "Diri sendiri", hak: "Pembelajaran, kehadiran, perpustakaan, komunikasi" },
  { peran: "Orang Tua", cakupan: "Anak tertaut", hak: "Monitoring anak, notifikasi, komunikasi, persetujuan" },
  { peran: "Operator Sekolah", cakupan: "1 sekolah", hak: "Master data, perangkat, operasional administratif" },
  { peran: "Bendahara", cakupan: "1 sekolah", hak: "Operasional keuangan" },
  { peran: "Pustakawan", cakupan: "1 sekolah", hak: "Operasional perpustakaan" },
  { peran: "Petugas UKS", cakupan: "1 sekolah", hak: "Operasional kesehatan terbatas" },
  { peran: "Security", cakupan: "1 sekolah", hak: "Keamanan, tamu, insiden" },
  { peran: "IT Admin", cakupan: "Sekolah/Dinas", hak: "Perangkat, integrasi, monitoring platform" },
  { peran: "Auditor", cakupan: "Sesuai penugasan", hak: "Read-only + audit/evidence" },
];

/* ---------- Ringkasan KPI ---------- */
export function ringkasan() {
  const rekap = rekapPresensi();
  const hadir = (rekap.find((r) => r.status === "Hadir")?.jumlah ?? 0) +
    (rekap.find((r) => r.status === "Terlambat")?.jumlah ?? 0);
  const totalPagu = ANGGARAN.reduce((a, b) => a + b.pagu, 0);
  const totalRealisasi = ANGGARAN.reduce((a, b) => a + b.realisasi, 0);
  return {
    totalSiswa: SISWA.length,
    totalGuru: GURU.length,
    totalKelas: KELAS.length,
    persenHadir: Math.round((hadir / SISWA.length) * 1000) / 10,
    totalPagu,
    totalRealisasi,
    persenSerapan: Math.round((totalRealisasi / totalPagu) * 1000) / 10,
    bukuDipinjam: SIRKULASI.filter((s) => s.status !== "Dikembalikan").length,
    insidenTerbuka: INSIDEN.filter((i) => i.status !== "Selesai").length,
    perangkatOnline: PERANGKAT.filter((d) => d.status === "Online").length,
    totalPerangkat: PERANGKAT.length,
    kunjunganUks: KUNJUNGAN_UKS.length,
    tugasAktif: TUGAS.filter((t) => t.status === "Aktif").length,
  };
}

export function rasioGuruSiswa() {
  const totalSiswa = SISWA.length;
  const totalGuru = GURU.length;
  const rasio = totalGuru > 0 ? totalSiswa / totalGuru : 0;
  const dibulatkan = Math.round(rasio * 10) / 10;
  const rekomendasi = dibulatkan <= 20 ? "Ideal (≤ 1:20)" : "Perlu tambahan guru";
  const guruPns = GURU.filter((g) => g.status === "PNS").length;
  const guruPppk = GURU.filter((g) => g.status === "PPPK").length;
  const guruHonorer = GURU.filter((g) => g.status === "Honorer").length;
  return {
    totalSiswa,
    totalGuru,
    rasio,
    dibulatkan,
    teks: `1:${dibulatkan}`,
    rekomendasi,
    guruPns,
    guruPppk,
    guruHonorer,
  };
}

export function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function namaKelas(kelasId: string) {
  return KELAS.find((k) => k.id === kelasId)?.nama ?? kelasId;
}

/* ---------- BRD-10 Dashboard & Analytics ---------- */
export const KPI_KATALOG = [
  { id: "KPI-01", nama: "Tingkat Kehadiran Siswa", formula: "(hadir + terlambat) / total siswa aktif", sumber: "Modul Kehadiran", owner: "Kepala Sekolah", frekuensi: "Real-time", versi: "v1.2", nilai: "94,6%", target: "≥ 95%", status: "Peringatan", refresh: "2026-09-04 10:25" },
  { id: "KPI-02", nama: "Rata-rata Nilai Sekolah", formula: "AVG(nilai akhir seluruh mapel)", sumber: "Modul Akademik", owner: "Kepala Sekolah", frekuensi: "Harian", versi: "v1.0", nilai: "82,4", target: "≥ 80", status: "Normal", refresh: "2026-09-04 06:00" },
  { id: "KPI-03", nama: "Serapan Anggaran BOS", formula: "realisasi / pagu × 100", sumber: "Modul Keuangan", owner: "Bendahara", frekuensi: "Harian", versi: "v1.1", nilai: "71,8%", target: "60–85%", status: "Normal", refresh: "2026-09-04 05:30" },
  { id: "KPI-04", nama: "Utilisasi Perpustakaan", formula: "buku dipinjam / total eksemplar", sumber: "Modul Perpustakaan", owner: "Pustakawan", frekuensi: "Harian", versi: "v1.0", nilai: "38,2%", target: "≥ 35%", status: "Normal", refresh: "2026-09-04 05:30" },
  { id: "KPI-05", nama: "Insiden Keamanan Terbuka", formula: "COUNT(insiden WHERE status ≠ Selesai)", sumber: "Smart Security", owner: "Security", frekuensi: "Real-time", versi: "v1.0", nilai: "2", target: "0", status: "Bahaya", refresh: "2026-09-04 10:31" },
  { id: "KPI-06", nama: "Ketersediaan Perangkat IoT", formula: "perangkat online / total perangkat", sumber: "IoT Platform", owner: "IT Admin", frekuensi: "5 menit", versi: "v1.3", nilai: "88,9%", target: "≥ 95%", status: "Peringatan", refresh: "2026-09-04 10:30" },
];

export const TREN_KPI = [
  { periode: "Apr", kehadiran: 93.1, nilai: 79.8, serapan: 22.4 },
  { periode: "Mei", kehadiran: 94.0, nilai: 80.6, serapan: 33.1 },
  { periode: "Jun", kehadiran: 92.4, nilai: 81.2, serapan: 41.7 },
  { periode: "Jul", kehadiran: 95.1, nilai: 81.9, serapan: 52.9 },
  { periode: "Ags", kehadiran: 94.2, nilai: 82.1, serapan: 64.5 },
  { periode: "Sep", kehadiran: 94.6, nilai: 82.4, serapan: 71.8 },
];

export const PERBANDINGAN_SEKOLAH = [
  { sekolah: "SDN 01 Kebagusan", kehadiran: 94.6, nilai: 82.4, serapan: 71.8, insiden: 2 },
  { sekolah: "SDN Cikini 02", kehadiran: 92.8, nilai: 80.1, serapan: 66.3, insiden: 1 },
  { sekolah: "SDN Pegangsaan 03", kehadiran: 95.7, nilai: 83.9, serapan: 74.5, insiden: 0 },
  { sekolah: "SDN Kebon Sirih 04", kehadiran: 91.2, nilai: 78.6, serapan: 58.9, insiden: 4 },
];

export const KUALITAS_DATA = [
  { id: "DQ-01", sumber: "Kehadiran", pemeriksaan: "Data hilang (siswa tanpa presensi)", temuan: 3, ambang: 5, status: "Normal", terakhir: "2026-09-04 10:20" },
  { id: "DQ-02", sumber: "Akademik", pemeriksaan: "Duplikasi entri nilai", temuan: 0, ambang: 0, status: "Normal", terakhir: "2026-09-04 06:05" },
  { id: "DQ-03", sumber: "Keuangan", pemeriksaan: "Outlier transaksi > 3σ", temuan: 2, ambang: 1, status: "Peringatan", terakhir: "2026-09-04 05:35" },
  { id: "DQ-04", sumber: "IoT Telemetry", pemeriksaan: "Event terlambat > 15 menit", temuan: 12, ambang: 10, status: "Peringatan", terakhir: "2026-09-04 10:30" },
  { id: "DQ-05", sumber: "Perpustakaan", pemeriksaan: "Referensi ISBN tidak valid", temuan: 0, ambang: 0, status: "Normal", terakhir: "2026-09-04 05:35" },
];

export const LAPORAN_TERJADWAL = [
  { id: "RPT-01", nama: "Executive School Scorecard", format: "PDF", jadwal: "Setiap Senin 07:00", penerima: "Kepala Sekolah, Dinas", status: "Aktif", terakhir: "2026-09-01 07:00" },
  { id: "RPT-02", nama: "Rekap Kehadiran Bulanan", format: "XLSX", jadwal: "Tanggal 1 tiap bulan", penerima: "Operator, Wali Kelas", status: "Aktif", terakhir: "2026-09-01 06:30" },
  { id: "RPT-03", nama: "Realisasi Anggaran BOS", format: "XLSX", jadwal: "Tanggal 5 tiap bulan", penerima: "Bendahara, Auditor", status: "Aktif", terakhir: "2026-08-05 06:30" },
  { id: "RPT-04", nama: "Security & IoT Health", format: "CSV", jadwal: "Harian 18:00", penerima: "IT Admin, Security", status: "Terjadwal", terakhir: "2026-09-03 18:00" },
];

export const INGESTION = [
  { sumber: "Modul Akademik", metode: "API batch", event: 1420, jeda: "6 jam", status: "Normal" },
  { sumber: "Modul Kehadiran", metode: "Event stream", event: 8630, jeda: "< 1 menit", status: "Normal" },
  { sumber: "Modul Keuangan", metode: "API batch", event: 312, jeda: "12 jam", status: "Normal" },
  { sumber: "IoT Platform", metode: "Telemetry MQTT", event: 24180, jeda: "18 menit", status: "Peringatan" },
  { sumber: "Smart Security", metode: "Event stream", event: 964, jeda: "< 1 menit", status: "Normal" },
];
