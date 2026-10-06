// Data contoh (dummy) integrasi 9 sistem Pemprov DKI & Kemendikdasmen untuk SDN Kebagusan 01 Pagi.
// Angka bersifat ilustrasi, disusun dari pola data publik sistem terkait — bukan data resmi.

export type Nada = "baik" | "peringatan" | "bahaya" | "info" | "netral";
export type SistemIntegrasi = {
  id: string;
  nama: string;
  sumber: string;
  url: string;
  kategori: string;
  sinkronTerakhir: string;
  status: "Tersinkron" | "Tertunda" | "Gagal";
  utama: { label: string; nilai: string };
  indikator: { label: string; nilai: string; nada?: Nada }[];
  kolom: string[];
  baris: string[][];
};

export const SISTEM_INTEGRASI: SistemIntegrasi[] = [
  {
    id: "jakaset",
    nama: "Aset Daerah",
    sumber: "JakAset",
    url: "https://jakaset.jakarta.go.id/latest/front/",
    kategori: "Inventarisasi, sensus, rekon, stock opname",
    sinkronTerakhir: "05 Okt 2026 06:00",
    status: "Tersinkron",
    utama: { label: "Nilai aset tercatat", nilai: "Rp 18,42 M" },
    indikator: [
      { label: "Jumlah barang (KIB)", nilai: "1.284 item" },
      { label: "Sensus aset", nilai: "94% selesai", nada: "baik" },
      { label: "Selisih rekon", nilai: "12 item", nada: "peringatan" },
      { label: "Stock opname persediaan", nilai: "Sep 2026 · sesuai", nada: "baik" },
    ],
    kolom: ["Kode KIB", "Uraian", "Jumlah", "Nilai (Rp)", "Kondisi"],
    baris: [
      ["KIB A", "Tanah bangunan sekolah", "1", "12.600.000.000", "Baik"],
      ["KIB B", "Peralatan & mesin", "842", "2.315.400.000", "Baik"],
      ["KIB C", "Gedung & bangunan", "3", "3.210.000.000", "Baik"],
      ["KIB E", "Buku & aset lainnya", "438", "294.600.000", "Rusak ringan"],
    ],
  },
  {
    id: "absensi",
    nama: "Kehadiran ASN",
    sumber: "absensi.jakarta.go.id · absensimobile",
    url: "https://absensi.jakarta.go.id",
    kategori: "Presensi operator & ketidakhadiran",
    sinkronTerakhir: "05 Okt 2026 14:30",
    status: "Tersinkron",
    utama: { label: "Kehadiran ASN hari ini", nilai: "92%" },
    indikator: [
      { label: "Hadir", nilai: "23 dari 25", nada: "baik" },
      { label: "Izin / Sakit", nilai: "1", nada: "peringatan" },
      { label: "Dinas luar", nilai: "1", nada: "info" },
      { label: "WFH", nilai: "0" },
    ],
    kolom: ["Nama", "Jam masuk", "Jam pulang", "Status"],
    baris: [
      ["Yulia Kratiningsih S.Pd", "06:41", "-", "Hadir"],
      ["Budi Santoso, S.Pd.", "06:52", "-", "Hadir"],
      ["Sri Wahyuni, S.Pd.", "-", "-", "Dinas luar"],
      ["Agus Prasetyo, S.Pd.", "-", "-", "Izin"],
    ],
  },
  {
    id: "etpp",
    nama: "E-Kinerja / TPP",
    sumber: "etpp.jakarta.go.id",
    url: "https://etpp.jakarta.go.id",
    kategori: "Aktivitas harian & capaian SKP",
    sinkronTerakhir: "05 Okt 2026 05:00",
    status: "Tersinkron",
    utama: { label: "Rata-rata capaian kinerja", nilai: "88,6" },
    indikator: [
      { label: "Aktivitas disetujui (Sep)", nilai: "96%", nada: "baik" },
      { label: "Menunggu verifikasi", nilai: "14 aktivitas", nada: "peringatan" },
      { label: "Predikat Sangat Baik", nilai: "9 pegawai", nada: "baik" },
      { label: "Estimasi TPP bulan ini", nilai: "Rp 186,4 jt" },
    ],
    kolom: ["Nama", "Menit kerja", "Capaian", "Predikat"],
    baris: [
      ["Yulia Kratiningsih S.Pd", "6.720", "94,2", "Sangat Baik"],
      ["Budi Santoso, S.Pd.", "6.540", "90,1", "Sangat Baik"],
      ["Sri Wahyuni, S.Pd.", "6.180", "86,0", "Baik"],
      ["Rina Marlina", "5.880", "81,5", "Baik"],
    ],
  },
  {
    id: "pegawai",
    nama: "Kepegawaian",
    sumber: "pegawai.jakarta.go.id",
    url: "https://pegawai.jakarta.go.id",
    kategori: "Riwayat jabatan, pangkat, golongan",
    sinkronTerakhir: "04 Okt 2026 22:00",
    status: "Tersinkron",
    utama: { label: "Total pegawai", nilai: "25 orang" },
    indikator: [
      { label: "PNS / PPPK / Honorer", nilai: "14 / 7 / 4" },
      { label: "Naik pangkat (Apr 2027)", nilai: "3 usulan", nada: "info" },
      { label: "KGB jatuh tempo", nilai: "2 pegawai", nada: "peringatan" },
      { label: "Pensiun ≤ 1 tahun", nilai: "1 pegawai", nada: "peringatan" },
    ],
    kolom: ["Nama", "Status", "Pangkat/Gol", "Jabatan"],
    baris: [
      ["Yulia Kratiningsih S.Pd", "PNS", "Pembina / IV-a", "Kepala Sekolah"],
      ["Budi Santoso, S.Pd.", "PNS", "Penata Tk.I / III-d", "Guru Ahli Muda"],
      ["Sri Wahyuni, S.Pd.", "PPPK", "Gol. IX", "Guru Ahli Pertama"],
      ["Rina Marlina", "Honorer", "-", "Tenaga Administrasi"],
    ],
  },
  {
    id: "rkas",
    nama: "Keuangan RKAS",
    sumber: "rkas.jakarta.go.id",
    url: "https://rkas.jakarta.go.id/main/auth",
    kategori: "Anggaran BOS & BOP",
    sinkronTerakhir: "05 Okt 2026 07:00",
    status: "Tersinkron",
    utama: { label: "Realisasi anggaran", nilai: "71,3%" },
    indikator: [
      { label: "Pagu BOS + BOP 2026", nilai: "Rp 1,46 M" },
      { label: "Realisasi", nilai: "Rp 1,04 M", nada: "baik" },
      { label: "SPJ belum lengkap", nilai: "3 kegiatan", nada: "peringatan" },
      { label: "Status RKAS Perubahan", nilai: "Disetujui", nada: "baik" },
    ],
    kolom: ["Sumber", "Pagu (Rp)", "Realisasi (Rp)", "%"],
    baris: [
      ["BOS Reguler", "582.400.000", "431.200.000", "74%"],
      ["BOP Pemprov DKI", "876.000.000", "610.500.000", "70%"],
    ],
  },
  {
    id: "siplah",
    nama: "Belanja SIPLah",
    sumber: "SIPLah Toko Ladang",
    url: "https://siplah.tokoladang.co.id/",
    kategori: "Pengadaan barang/jasa dana BOS",
    sinkronTerakhir: "05 Okt 2026 08:15",
    status: "Tertunda",
    utama: { label: "Total belanja 2026", nilai: "Rp 312,8 jt" },
    indikator: [
      { label: "Transaksi", nilai: "47 pesanan" },
      { label: "Barang diterima", nilai: "43", nada: "baik" },
      { label: "Dalam pengiriman", nilai: "3", nada: "info" },
      { label: "Belum dibayar (BAST)", nilai: "1", nada: "peringatan" },
    ],
    kolom: ["No. Pesanan", "Barang", "Nilai (Rp)", "Status"],
    baris: [
      ["SPL-2609-118", "Laptop pembelajaran (5 unit)", "42.500.000", "Diterima"],
      ["SPL-2609-121", "Buku teks Kurikulum Merdeka", "18.760.000", "Dikirim"],
      ["SPL-2610-004", "ATK semester ganjil", "6.420.000", "Menunggu bayar"],
    ],
  },
  {
    id: "dapodik",
    nama: "Dapodik",
    sumber: "dapo.kemendikdasmen.go.id",
    url: "https://dapo.kemendikdasmen.go.id/",
    kategori: "Data pokok sekolah, PTK, peserta didik",
    sinkronTerakhir: "03 Okt 2026 15:20",
    status: "Tersinkron",
    utama: { label: "Peserta didik terdata", nilai: "412 siswa" },
    indikator: [
      { label: "Rombel", nilai: "12" },
      { label: "PTK (guru + tendik)", nilai: "25" },
      { label: "Akreditasi", nilai: "A", nada: "baik" },
      { label: "Validasi data", nilai: "98,7% valid", nada: "baik" },
    ],
    kolom: ["Tingkat", "L", "P", "Total"],
    baris: [
      ["Kelas 1", "36", "34", "70"],
      ["Kelas 2", "35", "33", "68"],
      ["Kelas 3", "34", "36", "70"],
      ["Kelas 4", "33", "35", "68"],
      ["Kelas 5", "36", "32", "68"],
      ["Kelas 6", "34", "34", "68"],
    ],
  },
  {
    id: "siap",
    nama: "Mutasi Siswa (SIAP)",
    sumber: "siap.jakarta.go.id",
    url: "https://siap.jakarta.go.id/webapp/#/landingpage",
    kategori: "Proses transfer / mutasi peserta didik",
    sinkronTerakhir: "05 Okt 2026 09:00",
    status: "Tersinkron",
    utama: { label: "Mutasi tahun ajaran ini", nilai: "9 siswa" },
    indikator: [
      { label: "Mutasi masuk", nilai: "5", nada: "baik" },
      { label: "Mutasi keluar", nilai: "4", nada: "info" },
      { label: "Menunggu verifikasi", nilai: "2", nada: "peringatan" },
      { label: "Sisa kuota kursi", nilai: "8 kursi" },
    ],
    kolom: ["Nama Siswa", "Jenis", "Asal/Tujuan", "Status"],
    baris: [
      ["Raka Pratama", "Masuk", "SDN Ragunan 08", "Disetujui"],
      ["Nadia Salsabila", "Keluar", "SDN Depok Jaya 2", "Selesai"],
      ["Fikri Ramadhan", "Masuk", "SD Islam Al-Azhar", "Menunggu"],
    ],
  },
  {
    id: "tpg",
    nama: "Info GTK / TPG",
    sumber: "info.gtk.kemendikdasmen.go.id",
    url: "https://info.gtk.kemendikdasmen.go.id/",
    kategori: "Tunjangan Profesi Guru & validasi GTK",
    sinkronTerakhir: "04 Okt 2026 20:00",
    status: "Gagal",
    utama: { label: "Guru penerima TPG", nilai: "12 guru" },
    indikator: [
      { label: "Sudah bersertifikat pendidik", nilai: "15 dari 21" },
      { label: "SKTP Triwulan III terbit", nilai: "11", nada: "baik" },
      { label: "Tidak valid (jam mengajar)", nilai: "1 guru", nada: "bahaya" },
      { label: "Beban mengajar ≥ 24 JTM", nilai: "20 guru", nada: "baik" },
    ],
    kolom: ["Nama", "NUPTK", "JTM", "Status TPG"],
    baris: [
      ["Budi Santoso, S.Pd.", "3456 7890 1234 5678", "24", "Valid · SKTP terbit"],
      ["Sri Wahyuni, S.Pd.", "2345 6789 0123 4567", "24", "Valid · SKTP terbit"],
      ["Dewi Lestari, S.Pd.", "1234 5678 9012 3456", "20", "Tidak valid"],
    ],
  },
];
