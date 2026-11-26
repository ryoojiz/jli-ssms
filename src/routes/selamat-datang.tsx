import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { PERAN_LABEL, SEMUA_MODUL, type Peran } from "@/lib/rbac";

export const Route = createFileRoute("/selamat-datang")({
  head: () => ({
    meta: [
      { title: "Selamat Datang — SMS Sekolah Negeri Jakarta" },
      {
        name: "description",
        content:
          "Sistem Manajemen Sekolah Negeri Jakarta: satu data sekolah, akses berbasis peran, dan pengawasan lintas sekolah.",
      },
    ],
  }),
  component: HalamanSelamatDatang,
});

const CAKUPAN = [
  {
    grup: "Pusat Kendali",
    modul: ["Command Center", "Dashboard Pusat", "Lokasi Sekolah", "Analytics", "Analisis Laporan"],
  },
  {
    grup: "Modul Inti",
    modul: [
      "Akademik",
      "Kehadiran",
      "Keuangan",
      "Inventaris",
      "Perpustakaan",
      "Kesehatan",
      "Komunikasi",
    ],
  },
  {
    grup: "Smart School",
    modul: ["Smart Security", "Smart Classroom"],
  },
  {
    grup: "Administrasi",
    modul: ["Master Data & Audit", "Impor Data Excel", "Impor Modul"],
  },
] as const;

const PROFIL = [
  { file: "kepala-sekolah", peran: "kepala_sekolah" },
  { file: "wali-kelas", peran: "wali_kelas" },
  { file: "petugas-uks", peran: "uks" },
  { file: "keamanan", peran: "keamanan" },
  { file: "wali-murid", peran: "walimurid" },
  { file: "murid", peran: "siswa" },
] as const satisfies ReadonlyArray<{ file: string; peran: Peran }>;

const KELOMPOK_PERAN: Array<{ judul: string; peran: Peran[]; keterangan: string }> = [
  {
    judul: "Pimpinan & pengawas",
    peran: ["kepala_sekolah", "auditor", "pusat"],
    keterangan: "Lihat data lintas modul. Auditor dan pusat bersifat baca saja.",
  },
  {
    judul: "Operasional sekolah",
    peran: ["operator", "bendahara", "sarpras", "keamanan"],
    keterangan: "Kelola data master, anggaran, aset, dan keamanan sekolah.",
  },
  {
    judul: "Pendidikan & layanan",
    peran: ["guru", "wali_kelas", "pustakawan", "uks"],
    keterangan: "Jadwal, penilaian, sirkulasi buku, dan layanan kesehatan siswa.",
  },
  {
    judul: "Siswa & keluarga",
    peran: ["walimurid", "siswa"],
    keterangan: "Akses terbatas pada data akademik dan kehadiran yang terkait.",
  },
];

function HalamanSelamatDatang() {
  const { sesi } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (sesi) navigate({ to: "/", replace: true });
  }, [sesi, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pita-merah-putih h-1.5" aria-hidden />

      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-8">
          <Link to="/selamat-datang" className="flex min-w-0 items-center gap-3">
            <img
              src="/images/Jakarta.svg"
              alt="Logo DKI Jakarta"
              className="size-9 shrink-0 object-contain"
            />
            <span className="hidden h-8 w-px shrink-0 bg-border sm:block" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold uppercase tracking-[0.08em]">
                Smart School Management System
              </span>
              <span className="font-data block text-[11px] text-muted-foreground">
                Sekolah Negeri Jakarta
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 font-data text-xs text-muted-foreground lg:flex">
            <a href="#cakupan" className="hover:text-primary">
              Cakupan sistem
            </a>
            <a href="#peran" className="hover:text-primary">
              Peran & akses
            </a>
            <a href="#tata-kelola" className="hover:text-primary">
              Tata kelola
            </a>
          </nav>

          <Button asChild size="sm" className="shrink-0">
            <Link to="/auth">
              Masuk <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 md:px-8">
        <section className="relative overflow-hidden rounded-lg border border-border bg-card py-12 md:py-16 lg:py-20">
          <img
            src="/images/hero.png"
            alt=""
            aria-hidden="true"
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-95"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card from-10% via-card/90 via-70% to-card/20 lg:from-30% lg:via-60% lg:to-card/0"
            aria-hidden="true"
          />
          <div className="relative px-6 md:px-10">
            <div className="max-w-2xl">
              <div className="flex items-center" aria-label="Peran pengguna">
                {PROFIL.map((profil, i) => (
                  <img
                    key={profil.file}
                    src={`/images/profile-pictures/${profil.file}.png`}
                    alt={PERAN_LABEL[profil.peran]}
                    title={PERAN_LABEL[profil.peran]}
                    className={`size-14 rounded-full border-3 border-card bg-secondary object-cover ${
                      i > 0 ? "-ml-3" : ""
                    }`}
                  />
                ))}
              </div>
              <h1 className="mt-4 max-w-2xl text-[32px] font-bold leading-[1.12] tracking-tight md:text-[44px]">
                Satu data sekolah, akses yang tepat, pengawasan yang jelas.
              </h1>
              <p className="mt-5 max-w-xl font-data text-sm leading-6 text-muted-foreground">
                Smart School Management System menyatukan akademik, kehadiran, keuangan, layanan
                siswa, dan pengawasan daerah dalam satu sistem. Setiap pengguna melihat data sesuai
                perannya, dengan jejak audit yang dapat ditelusuri.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/auth">
                    Masuk ke akun sekolah <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#cakupan">Lihat cakupan sistem</a>
                </Button>
              </div>

              {/* <dl className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-border border-y border-border py-4 font-data">
                <div className="pr-3">
                  <dd className="text-xl font-semibold tabular-nums text-foreground">
                    {SEMUA_MODUL.length}
                  </dd>
                  <dt className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    modul terdaftar
                  </dt>
                </div>
                <div className="px-3">
                  <dd className="text-xl font-semibold tabular-nums text-foreground">
                    {Object.keys(PERAN_LABEL).length}
                  </dd>
                  <dt className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    peran pengguna
                  </dt>
                </div>
              </dl> */}
            </div>
          </div>
        </section>

        <section id="cakupan" className="border-t border-border py-12">
          <div className="max-w-2xl">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <p className="font-data text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Cakupan sistem
                </p>
                <span className="font-data rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  {SEMUA_MODUL.length} modul
                </span>
              </div>
              <ol className="divide-y divide-border">
                {CAKUPAN.map((grup, i) => (
                  <li key={grup.grup} className="grid grid-cols-[2rem_1fr] gap-3 px-4 py-3.5">
                    <span className="font-data pt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold">{grup.grup}</p>
                      <p className="font-data mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] leading-4 text-muted-foreground">
                        {grup.modul.map((modul, j) => (
                          <span key={modul} className="whitespace-nowrap">
                            {modul}
                            {j < grup.modul.length - 1 ? (
                              <span className="ml-2 text-border" aria-hidden>
                                ·
                              </span>
                            ) : null}
                          </span>
                        ))}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="peran" className="border-t border-border py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                Dirancang untuk setiap peran
              </h2>
            </div>
            <p className="font-data max-w-md text-xs leading-5 text-muted-foreground">
              Izin menentukan modul yang tampil dan apakah pengguna boleh mengubah data.
            </p>
          </div>

          <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-card">
            {KELOMPOK_PERAN.map((grup) => (
              <div
                key={grup.judul}
                className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,0.32fr)_minmax(0,0.4fr)_minmax(0,0.28fr)] md:items-center md:gap-6"
              >
                <p className="text-[13px] font-semibold">{grup.judul}</p>
                <div className="flex flex-wrap gap-1.5">
                  {grup.peran.map((peran) => (
                    <span
                      key={peran}
                      className="font-data rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                    >
                      {PERAN_LABEL[peran]}
                    </span>
                  ))}
                </div>
                <p className="font-data text-xs leading-5 text-muted-foreground">
                  {grup.keterangan}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="tata-kelola" className="border-t border-border py-12">
          <p className="font-data text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Tata kelola data
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Alur yang dapat dipertanggungjawabkan
          </h2>
          <div className="mt-6 grid gap-0 md:grid-cols-3 md:divide-x md:divide-border">
            {[
              {
                angka: "01",
                judul: "Satu data per sekolah",
                isi: "Modul berbagi konteks sekolah yang sama: siswa, kelas, kehadiran, keuangan, dan layanan.",
              },
              {
                angka: "02",
                judul: "Izin sesuai peran",
                isi: "Pimpinan, staf, guru, orang tua, dan siswa melihat tampilan yang sesuai kewenangannya.",
              },
              {
                angka: "03",
                judul: "Jejak audit",
                isi: "Perubahan penting dicatat bersama aktor, waktu, serta nilai sebelum dan sesudahnya.",
              },
            ].map((langkah) => (
              <div
                key={langkah.angka}
                className="border-b border-border py-5 md:border-b-0 md:px-6 md:first:pl-0 md:last:pr-0"
              >
                <p className="font-data text-[11px] font-semibold tabular-nums text-primary">
                  {langkah.angka}
                </p>
                <h3 className="mt-2 text-base font-semibold">{langkah.judul}</h3>
                <p className="font-data mt-2 text-xs leading-5 text-muted-foreground">
                  {langkah.isi}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-16">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg border border-border bg-secondary px-6 py-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Siap mengakses dashboard sekolah?
              </h2>
              <p className="font-data mt-1 text-xs text-muted-foreground">
                Gunakan akun yang telah didaftarkan oleh sekolah atau administrator pusat.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/auth">
                Masuk sekarang <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-primary">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-6 md:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/images/Jakarta.svg"
              alt="Logo DKI Jakarta"
              className="size-8 object-contain"
            />
            <img
              src="/images/JLI.png"
              alt="Logo JakLingko Indonesia"
              className="h-7 w-24 object-contain object-left"
            />
          </div>
          <p className="font-data text-[11px] text-white/50">
            Smart School Management System · Sekolah Negeri Jakarta
          </p>
        </div>
      </footer>
    </div>
  );
}
