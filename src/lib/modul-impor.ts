// Konfigurasi impor Excel per modul dashboard.
export type LembarImpor = { nama: string; kolom: string[]; kunci: number[] };
export type ModulImpor = { id: string; label: string; file: string; lembar: LembarImpor[] };

export const MODUL_IMPOR: ModulImpor[] = [
  {
    "id": "kpi",
    "label": "KPI",
    "file": "/template-impor/kpi.xlsx",
    "lembar": [
      {
        "nama": "KPI",
        "kolom": [
          "Kode KPI",
          "Nama Indikator",
          "Kategori",
          "Satuan",
          "Target",
          "Realisasi",
          "Periode",
          "Penanggung Jawab",
          "Keterangan"
        ],
        "kunci": [
          0
        ]
      }
    ]
  },
  {
    "id": "kualitas-data",
    "label": "Kualitas Data",
    "file": "/template-impor/kualitas-data.xlsx",
    "lembar": [
      {
        "nama": "Kualitas Data",
        "kolom": [
          "Tanggal Cek",
          "Tabel/Data",
          "Jumlah Baris",
          "Baris Lengkap",
          "Baris Duplikat",
          "Baris Tidak Valid",
          "Status",
          "Catatan"
        ],
        "kunci": [
          0,
          1
        ]
      }
    ]
  },
  {
    "id": "pipeline",
    "label": "Pipeline Ingestion",
    "file": "/template-impor/pipeline.xlsx",
    "lembar": [
      {
        "nama": "Pipeline Ingestion",
        "kolom": [
          "ID Pipeline",
          "Sumber Data",
          "Tujuan",
          "Frekuensi",
          "Waktu Terakhir",
          "Status",
          "Jumlah Baris",
          "Durasi (detik)",
          "Pesan Error"
        ],
        "kunci": [
          0
        ]
      }
    ]
  },
  {
    "id": "laporan-terjadwal",
    "label": "Laporan Terjadwal",
    "file": "/template-impor/laporan-terjadwal.xlsx",
    "lembar": [
      {
        "nama": "Laporan Terjadwal",
        "kolom": [
          "ID Laporan",
          "Nama Laporan",
          "Jadwal",
          "Hari/Tanggal Kirim",
          "Jam",
          "Penerima (email)",
          "Format",
          "Status Aktif"
        ],
        "kunci": [
          0
        ]
      }
    ]
  },
  {
    "id": "akademik",
    "label": "Akademik (Jadwal, Tugas, Ujian, Nilai)",
    "file": "/template-impor/akademik.xlsx",
    "lembar": [
      {
        "nama": "Jadwal",
        "kolom": [
          "Hari",
          "Jam Mulai",
          "Jam Selesai",
          "Kelas",
          "Mata Pelajaran",
          "NIP Guru",
          "Nama Guru",
          "Ruang"
        ],
        "kunci": [
          0,
          1,
          3
        ]
      },
      {
        "nama": "Tugas",
        "kolom": [
          "ID Tugas",
          "Judul",
          "Mata Pelajaran",
          "Kelas",
          "NIP Guru",
          "Tanggal Diberikan",
          "Tenggat",
          "Deskripsi"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "Ujian",
        "kolom": [
          "ID Ujian",
          "Nama Ujian",
          "Jenis",
          "Mata Pelajaran",
          "Kelas",
          "Tanggal",
          "Durasi (menit)",
          "KKM"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "Nilai E-Rapor",
        "kolom": [
          "NISN",
          "Nama Siswa",
          "Kelas",
          "Mata Pelajaran",
          "Jenis Nilai",
          "Nilai (0-100)",
          "Semester",
          "Tahun Ajaran",
          "Catatan Guru"
        ],
        "kunci": [
          0,
          3,
          4,
          6,
          7
        ]
      }
    ]
  },
  {
    "id": "keuangan",
    "label": "Keuangan",
    "file": "/template-impor/keuangan.xlsx",
    "lembar": [
      {
        "nama": "Keuangan",
        "kolom": [
          "Tanggal",
          "No. Bukti",
          "Jenis",
          "Kategori",
          "Sumber/Tujuan Dana",
          "Uraian",
          "Jumlah (Rp)",
          "Petugas"
        ],
        "kunci": [
          1
        ]
      }
    ]
  },
  {
    "id": "inventaris",
    "label": "Inventaris",
    "file": "/template-impor/inventaris.xlsx",
    "lembar": [
      {
        "nama": "Inventaris",
        "kolom": [
          "Kode Barang",
          "Nama Barang",
          "Kategori",
          "Lokasi/Ruang",
          "Jumlah",
          "Kondisi",
          "Tahun Perolehan",
          "Sumber Dana",
          "Harga Satuan (Rp)"
        ],
        "kunci": [
          0
        ]
      }
    ]
  },
  {
    "id": "perpustakaan",
    "label": "Perpustakaan",
    "file": "/template-impor/perpustakaan.xlsx",
    "lembar": [
      {
        "nama": "Buku Perpustakaan",
        "kolom": [
          "Kode Buku",
          "Judul",
          "Pengarang",
          "Penerbit",
          "Tahun",
          "ISBN",
          "Kategori",
          "Jumlah Eksemplar",
          "Rak"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "Peminjaman Buku",
        "kolom": [
          "ID Pinjam",
          "Kode Buku",
          "NISN",
          "Nama Peminjam",
          "Tanggal Pinjam",
          "Jatuh Tempo",
          "Tanggal Kembali",
          "Status"
        ],
        "kunci": [
          0
        ]
      }
    ]
  },
  {
    "id": "kesehatan",
    "label": "Kesehatan",
    "file": "/template-impor/kesehatan.xlsx",
    "lembar": [
      {
        "nama": "Kesehatan UKS",
        "kolom": [
          "ID Kunjungan",
          "Tanggal",
          "Jam",
          "NISN",
          "Nama Siswa",
          "Kelas",
          "Keluhan",
          "Tindakan",
          "Petugas",
          "Wali Dihubungi"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "Pemeriksaan Kesehatan",
        "kolom": [
          "Tanggal",
          "NISN",
          "Nama Siswa",
          "Kelas",
          "Tinggi (cm)",
          "Berat (kg)",
          "Penglihatan",
          "Gigi",
          "Imunisasi Lengkap",
          "Catatan"
        ],
        "kunci": [
          0,
          1
        ]
      }
    ]
  },
  {
    "id": "komunikasi",
    "label": "Komunikasi",
    "file": "/template-impor/komunikasi.xlsx",
    "lembar": [
      {
        "nama": "Komunikasi",
        "kolom": [
          "ID Pengumuman",
          "Tanggal",
          "Judul",
          "Isi",
          "Sasaran",
          "Kelas (opsional)",
          "Pengirim",
          "Prioritas"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "Izin Siswa",
        "kolom": [
          "ID Izin",
          "Tanggal",
          "NISN",
          "Nama Siswa",
          "Kelas",
          "Jenis",
          "Alasan",
          "Diajukan Oleh",
          "Status"
        ],
        "kunci": [
          0
        ]
      }
    ]
  },
  {
    "id": "keamanan",
    "label": "Smart Security",
    "file": "/template-impor/keamanan.xlsx",
    "lembar": [
      {
        "nama": "Smart Security - CCTV",
        "kolom": [
          "ID Kamera",
          "Nama/Lokasi",
          "Area",
          "IP/Stream URL",
          "Status",
          "Tanggal Pasang",
          "Terakhir Dicek"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "Smart Security - Kejadian",
        "kolom": [
          "ID Kejadian",
          "Tanggal",
          "Jam",
          "Lokasi",
          "Jenis Kejadian",
          "Tingkat",
          "Deskripsi",
          "Petugas",
          "Status"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "Smart Security - Akses",
        "kolom": [
          "Tanggal",
          "Jam",
          "Nama",
          "Peran",
          "Titik Akses",
          "Arah",
          "Metode"
        ],
        "kunci": [
          0,
          1,
          2,
          4
        ]
      }
    ]
  },
  {
    "id": "integrasi",
    "label": "Integrasi 9 Sistem (Aset, ASN, Kinerja, RKAS, Dapodik, dll)",
    "file": "/template-impor/integrasi.xlsx",
    "lembar": [
      {
        "nama": "Aset JakAset",
        "kolom": [
          "Kode Barang",
          "Kode KIB",
          "Uraian",
          "Jumlah",
          "Nilai (Rp)",
          "Kondisi",
          "Status Sensus",
          "Selisih Rekon",
          "Tanggal Stock Opname"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "Kehadiran ASN",
        "kolom": [
          "Tanggal",
          "NIP",
          "Nama",
          "Jam Masuk",
          "Jam Pulang",
          "Status",
          "Keterangan"
        ],
        "kunci": [
          0,
          1
        ]
      },
      {
        "nama": "Ketidakhadiran ASN",
        "kolom": [
          "ID Pengajuan",
          "NIP",
          "Nama",
          "Jenis",
          "Tanggal Mulai",
          "Tanggal Selesai",
          "Alasan",
          "Status"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "E-Kinerja",
        "kolom": [
          "Periode",
          "NIP",
          "Nama",
          "Menit Kerja",
          "Aktivitas Disetujui",
          "Capaian",
          "Predikat",
          "Estimasi TPP (Rp)"
        ],
        "kunci": [
          0,
          1
        ]
      },
      {
        "nama": "Kepegawaian",
        "kolom": [
          "NIP",
          "Nama",
          "Status",
          "Pangkat",
          "Golongan",
          "Jabatan",
          "TMT Jabatan",
          "KGB Berikutnya",
          "Tanggal Pensiun"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "RKAS",
        "kolom": [
          "Tahun",
          "Sumber Dana",
          "Kode Kegiatan",
          "Nama Kegiatan",
          "Pagu (Rp)",
          "Realisasi (Rp)",
          "Status SPJ"
        ],
        "kunci": [
          0,
          1,
          2
        ]
      },
      {
        "nama": "SIPLah",
        "kolom": [
          "No. Pesanan",
          "Tanggal",
          "Toko",
          "Barang",
          "Nilai (Rp)",
          "Sumber Dana",
          "Status"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "Dapodik",
        "kolom": [
          "Tingkat",
          "Rombel",
          "Laki-laki",
          "Perempuan",
          "PTK",
          "Akreditasi",
          "Tanggal Sinkron"
        ],
        "kunci": [
          0,
          1
        ]
      },
      {
        "nama": "Mutasi SIAP",
        "kolom": [
          "ID Mutasi",
          "NISN",
          "Nama Siswa",
          "Jenis",
          "Kelas",
          "Sekolah Asal/Tujuan",
          "Tanggal",
          "Status"
        ],
        "kunci": [
          0
        ]
      },
      {
        "nama": "Info GTK TPG",
        "kolom": [
          "NUPTK",
          "NIP",
          "Nama",
          "Sertifikasi",
          "JTM",
          "Triwulan",
          "Status SKTP",
          "Keterangan"
        ],
        "kunci": [
          0,
          5
        ]
      }
    ]
  }
  
];

export const ID_MODUL_IMPOR = MODUL_IMPOR.map((m) => m.id);
