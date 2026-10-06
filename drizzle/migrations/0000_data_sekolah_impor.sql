CREATE TABLE public.guru (
  nip text PRIMARY KEY,
  nama text NOT NULL,
  jenis_kelamin text,
  jabatan text,
  mapel text,
  wali_kelas text,
  telp text,
  email text,
  status text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.kelas (
  id text PRIMARY KEY,
  tingkat int NOT NULL,
  rombel text,
  nip_wali text,
  ruang text,
  kapasitas int,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.siswa (
  nisn text PRIMARY KEY,
  nis text,
  nama text NOT NULL,
  jenis_kelamin text,
  tanggal_lahir date,
  kelas_id text NOT NULL,
  alamat text,
  nama_ayah text,
  nama_ibu text,
  nama_wali text,
  telp_wali text,
  email_wali text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.kehadiran (
  tanggal date NOT NULL,
  nisn text NOT NULL,
  kelas_id text NOT NULL,
  status text NOT NULL,
  keterangan text,
  PRIMARY KEY (tanggal, nisn)
);
GRANT ALL ON public.guru, public.kelas, public.siswa, public.kehadiran TO service_role;
ALTER TABLE public.guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kehadiran ENABLE ROW LEVEL SECURITY;