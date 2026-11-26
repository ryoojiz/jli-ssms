import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarCheck,
  Cpu,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { getPusatSchoolDetail, getPusatSnapshot } from "@/lib/pusat.functions";

type Snapshot = Awaited<ReturnType<typeof getPusatSnapshot>>;
type Detail = Awaited<ReturnType<typeof getPusatSchoolDetail>>;
type Sekolah = Snapshot["sekolah"][number];

const bilangan = (n: number) => Math.round(n).toLocaleString("id-ID");
const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function penggunaSnapshot() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let aktif = true;
    getPusatSnapshot()
      .then((hasil) => aktif && setData(hasil))
      .catch(
        (error: unknown) =>
          aktif && setGalat(error instanceof Error ? error.message : "Gagal memuat data pusat."),
      );
    return () => {
      aktif = false;
    };
  }, []);
  return { data, galat };
}

function penggunaDetail(schoolId: string) {
  const [data, setData] = useState<Detail | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let aktif = true;
    setData(null);
    getPusatSchoolDetail({ data: { schoolId } })
      .then((hasil) => aktif && setData(hasil))
      .catch(
        (error: unknown) =>
          aktif &&
          setGalat(error instanceof Error ? error.message : "Gagal memuat detail sekolah."),
      );
    return () => {
      aktif = false;
    };
  }, [schoolId]);
  return { data, galat };
}

function StatusData({ sekolah }: { sekolah: Sekolah }) {
  return (
    <StatusPill nada={sekolah.adaData ? "baik" : "peringatan"}>
      {sekolah.adaData ? "Data tersedia" : "Belum ada data"}
    </StatusPill>
  );
}

function KartuRingkas({
  total,
  jumlahSekolah,
}: {
  total: Snapshot["total"];
  jumlahSekolah: number;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Sekolah terdaftar"
        nilai={bilangan(jumlahSekolah)}
        keterangan="Seluruh sekolah dalam sistem"
        icon={Building2}
      />
      <StatCard
        label="Total siswa"
        nilai={bilangan(total.siswa)}
        keterangan={`${bilangan(total.guru)} guru · ${bilangan(total.rombel)} rombel`}
        icon={Users}
      />
      <StatCard
        label="Kehadiran rata-rata"
        nilai={total.kehadiran}
        satuan="%"
        keterangan={`${bilangan(total.kehadiranSampel)} catatan kehadiran`}
        icon={CalendarCheck}
      />
      <StatCard
        label="Rata-rata nilai"
        nilai={total.nilai}
        keterangan={`${bilangan(total.nilaiSampel)} nilai tercatat`}
        icon={GraduationCap}
      />
      <StatCard
        label="Serapan anggaran"
        nilai={total.serapan}
        satuan="%"
        keterangan={`${rupiah(total.realisasi)} dari ${rupiah(total.pagu)}`}
        icon={Wallet}
      />
      <StatCard
        label="Insiden terbuka"
        nilai={bilangan(total.insidenTerbuka)}
        keterangan={`${bilangan(total.insiden)} insiden tercatat`}
        icon={AlertTriangle}
      />
      <StatCard
        label="Indikator perlu perhatian"
        nilai={bilangan(total.kpiWaspada)}
        keterangan={`${bilangan(total.kpi)} KPI dalam katalog`}
        icon={ShieldCheck}
      />
      <StatCard
        label="Perangkat & kunjungan UKS"
        nilai={`${bilangan(total.perangkat)}/${bilangan(total.kunjunganUks)}`}
        keterangan="Perangkat aktif · kunjungan tercatat"
        icon={Cpu}
      />
    </section>
  );
}

function GrafikSekolah({ sekolah }: { sekolah: Sekolah[] }) {
  const data = sekolah.map((s) => ({
    nama: s.nama.replace(/^SD Negeri\s*/i, "").slice(0, 22),
    siswa: s.siswa,
    guru: s.guru,
  }));
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground">Siswa & guru per sekolah</h2>
      <p className="mb-4 text-xs text-muted-foreground">Perbandingan cakupan setiap sekolah.</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="nama" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
            <Tooltip
              contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)", fontSize: 12 }}
            />
            <Bar dataKey="siswa" name="Siswa" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="guru" name="Guru" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function GrafikTren({ tren }: { tren: Snapshot["tren"] }) {
  if (tren.length === 0) return null;
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground">Tren indikator tercatat</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Rata-rata kehadiran, nilai, dan serapan dari data yang tersedia di sekolah.
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={tren}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="periode" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="kehadiran"
              name="Kehadiran (%)"
              stroke="var(--color-primary)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="nilai"
              name="Nilai rata-rata"
              stroke="var(--color-info)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="serapan"
              name="Serapan (%)"
              stroke="var(--color-warning)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function TabelSekolah({ sekolah }: { sekolah: Sekolah[] }) {
  return (
    <TabelData
      judul="Rekap seluruh sekolah"
      deskripsi="Klik nama sekolah untuk membuka drilldown data sekolah tersebut."
      data={sekolah}
      kolom={[
        {
          judul: "Sekolah",
          render: (s) => (
            <Link
              to="/pusat/$schoolId"
              params={{ schoolId: s.id }}
              className="font-semibold text-primary hover:underline"
            >
              {s.nama}
            </Link>
          ),
        },
        { judul: "NPSN", render: (s) => s.npsn },
        { judul: "Siswa", kanan: true, render: (s) => bilangan(s.siswa) },
        { judul: "Guru", kanan: true, render: (s) => bilangan(s.guru) },
        { judul: "Kehadiran", kanan: true, render: (s) => `${s.kehadiran}%` },
        { judul: "Nilai", kanan: true, render: (s) => s.nilai },
        { judul: "Serapan", kanan: true, render: (s) => `${s.serapan}%` },
        { judul: "Status", render: (s) => <StatusData sekolah={s} /> },
        {
          judul: "Detail",
          render: (s) => (
            <Link
              to="/pusat/$schoolId"
              params={{ schoolId: s.id }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Lihat <ArrowRight className="size-3" />
            </Link>
          ),
        },
      ]}
    />
  );
}

function MuatGagal({ galat }: { galat: string }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      {galat}
    </div>
  );
}

function Muat() {
  return <p className="py-10 text-center text-sm text-muted-foreground">Memuat data sekolah…</p>;
}

/** Landing page eksekutif untuk akun pusat. */
export function BerandaPusat() {
  const { data, galat } = penggunaSnapshot();
  return (
    <AppShell>
      <PageHeader
        judul="Ringkasan Eksekutif Sekolah"
        deskripsi="Gambaran gabungan seluruh sekolah yang terdaftar, dengan akses drilldown per sekolah."
        aksi={
          <Link
            to="/pusat"
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Buka dashboard lengkap
          </Link>
        }
      />
      {galat ? <MuatGagal galat={galat} /> : null}
      {!data && !galat ? <Muat /> : null}
      {data ? (
        <div className="space-y-6">
          <KartuRingkas total={data.total} jumlahSekolah={data.sekolah.length} />
          <div className="grid gap-4 lg:grid-cols-2">
            <GrafikSekolah sekolah={data.sekolah} />
            <GrafikTren tren={data.tren} />
          </div>
          <TabelSekolah sekolah={data.sekolah} />
        </div>
      ) : null}
    </AppShell>
  );
}

/** Halaman dashboard pusat (rute /pusat). */
export function DashboardPusat() {
  const { data, galat } = penggunaSnapshot();
  return (
    <AppShell>
      <PageHeader
        judul="Dashboard Pusat — Data Gabungan Sekolah"
        deskripsi="Agregasi data seluruh sekolah untuk keperluan pelaporan dan pengawasan. Baca saja."
      />
      {galat ? <MuatGagal galat={galat} /> : null}
      {!data && !galat ? <Muat /> : null}
      {data ? (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            Data diambil{" "}
            {new Date(data.dibuatPada).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB.
            Sekolah tanpa catatan ditampilkan dengan status “Belum ada data”.
          </p>
          <KartuRingkas total={data.total} jumlahSekolah={data.sekolah.length} />
          <div className="grid gap-4 lg:grid-cols-2">
            <GrafikSekolah sekolah={data.sekolah} />
            <GrafikTren tren={data.tren} />
          </div>
          <TabelSekolah sekolah={data.sekolah} />
        </div>
      ) : null}
    </AppShell>
  );
}

/** Drilldown satu sekolah (rute /pusat/$schoolId). */
export function DetailSekolahPusat({ schoolId }: { schoolId: string }) {
  const { data, galat } = penggunaDetail(schoolId);
  return (
    <AppShell>
      <PageHeader
        judul={data ? `Detail — ${data.sekolah.nama}` : "Detail Sekolah"}
        deskripsi="Rincian data sekolah terpilih. Akses baca saja; perubahan data tetap melalui akun sekolah."
        aksi={
          <Link
            to="/pusat"
            className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-xs font-semibold hover:bg-accent"
          >
            <ArrowLeft className="size-3" /> Kembali ke dashboard
          </Link>
        }
      />
      {galat ? <MuatGagal galat={galat} /> : null}
      {!data && !galat ? <Muat /> : null}
      {data ? (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">{data.sekolah.nama}</h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {data.sekolah.alamat || "Alamat belum diisi"}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>NPSN {data.sekolah.npsn}</p>
                <p>{data.sekolah.kepalaSekolah}</p>
                <p>
                  {data.sekolah.tahunAjaran} · Semester {data.sekolah.semester}
                </p>
              </div>
            </div>
          </Card>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Siswa"
              nilai={bilangan(data.metrik.siswa)}
              keterangan={`${bilangan(data.metrik.rombel)} rombel`}
              icon={Users}
            />
            <StatCard
              label="Guru"
              nilai={bilangan(data.metrik.guru)}
              keterangan="Tenaga pengajar tercatat"
              icon={GraduationCap}
            />
            <StatCard
              label="Kehadiran"
              nilai={data.metrik.kehadiran}
              satuan="%"
              keterangan={`${bilangan(data.metrik.kehadiranSampel)} catatan`}
              icon={CalendarCheck}
            />
            <StatCard
              label="Rata-rata nilai"
              nilai={data.metrik.nilai}
              keterangan={`${bilangan(data.metrik.nilaiSampel)} nilai`}
              icon={BookOpen}
            />
            <StatCard
              label="Serapan anggaran"
              nilai={data.metrik.serapan}
              satuan="%"
              keterangan={`${rupiah(data.metrik.realisasi)} dari ${rupiah(data.metrik.pagu)}`}
              icon={Wallet}
            />
            <StatCard
              label="Insiden terbuka"
              nilai={bilangan(data.metrik.insidenTerbuka)}
              keterangan={`${bilangan(data.metrik.insiden)} insiden tercatat`}
              icon={AlertTriangle}
            />
            <StatCard
              label="Perangkat"
              nilai={bilangan(data.metrik.perangkat)}
              keterangan="CCTV, gate, sensor, dll."
              icon={Cpu}
            />
            <StatCard
              label="Audit trail"
              nilai={bilangan(data.metrik.audit)}
              keterangan="Peristiwa tercatat"
              icon={ShieldCheck}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <TabelData
              judul="Siswa per kelas"
              deskripsi="Jumlah siswa yang terdaftar pada masing-masing rombel."
              data={data.kelas}
              kolom={[
                { judul: "Kelas", render: (k) => k.nama },
                { judul: "Tingkat", kanan: true, render: (k) => k.tingkat },
                { judul: "Siswa", kanan: true, render: (k) => bilangan(k.siswa) },
              ]}
            />
            <TabelData
              judul="Rata-rata nilai per mata pelajaran"
              deskripsi="Dari nilai historis yang tersimpan di sekolah ini."
              data={data.mapel}
              kolom={[
                { judul: "Mata pelajaran", render: (m) => m.nama },
                { judul: "Jumlah nilai", kanan: true, render: (m) => bilangan(m.jumlah) },
                { judul: "Rata-rata", kanan: true, render: (m) => m.rata },
              ]}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TabelData
              judul="Kehadiran per tanggal"
              deskripsi="Persentase hadir dan terlambat dari catatan yang tersedia."
              data={data.kehadiran}
              kolom={[
                { judul: "Tanggal", render: (h) => h.tanggal },
                { judul: "Catatan", kanan: true, render: (h) => bilangan(h.total) },
                { judul: "Hadir", kanan: true, render: (h) => `${h.persen}%` },
              ]}
            />
            <TabelData
              judul="Serapan anggaran per program"
              deskripsi="Realisasi terhadap pagu yang tercatat."
              data={data.anggaran}
              kolom={[
                { judul: "Program", render: (a) => a.program },
                { judul: "Pagu", kanan: true, render: (a) => rupiah(a.pagu) },
                { judul: "Realisasi", kanan: true, render: (a) => rupiah(a.realisasi) },
                { judul: "Serapan", kanan: true, render: (a) => `${a.serapan}%` },
              ]}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <TabelData
              judul="Katalog KPI"
              deskripsi="Indikator dan status capaian sekolah."
              data={data.kpi}
              kolom={[
                { judul: "Indikator", render: (k) => k.nama },
                { judul: "Nilai", kanan: true, render: (k) => k.nilai },
                {
                  judul: "Status",
                  render: (k) => <StatusPill nada={nadaStatus(k.status)}>{k.status}</StatusPill>,
                },
              ]}
            />
            <TabelData
              judul="Insiden keamanan"
              deskripsi="Catatan insiden terbaru di sekolah ini."
              data={data.insiden}
              kolom={[
                { judul: "Jenis", render: (i) => i.jenis },
                { judul: "Lokasi", render: (i) => i.lokasi },
                { judul: "Tingkat", render: (i) => i.tingkat },
                {
                  judul: "Status",
                  render: (i) => <StatusPill nada={nadaStatus(i.status)}>{i.status}</StatusPill>,
                },
              ]}
            />
            <TabelData
              judul="Perangkat tercatat"
              deskripsi="Status perangkat smart school."
              data={data.perangkat}
              kolom={[
                { judul: "Nama", render: (d) => d.nama },
                { judul: "Tipe", render: (d) => d.tipe },
                {
                  judul: "Status",
                  render: (d) => <StatusPill nada={nadaStatus(d.status)}>{d.status}</StatusPill>,
                },
              ]}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TabelData
              judul="Komposisi guru"
              deskripsi="Berdasarkan status kepegawaian."
              data={data.guru}
              kolom={[
                { judul: "Status", render: (g) => g.status },
                { judul: "Jumlah", kanan: true, render: (g) => bilangan(g.jumlah) },
              ]}
            />
            <TabelData
              judul="Aktivitas audit terbaru"
              deskripsi="Riwayat perubahan data di sekolah ini."
              data={data.audit}
              kolom={[
                { judul: "Aksi", render: (a) => a.aksi },
                { judul: "Oleh", render: (a) => a.aktor },
                { judul: "Waktu", render: (a) => a.waktu },
              ]}
            />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
