import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarCheck,
  Cpu,
  GraduationCap,
  MapPin,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
const rasio = (siswa: number, guru: number) => (guru > 0 ? `${(siswa / guru).toFixed(1)}` : "—");
const WARNA_GRAFIK = [
  "var(--color-primary)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-destructive)",
];

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
  kehadiranGuru,
}: {
  total: Snapshot["total"];
  jumlahSekolah: number;
  kehadiranGuru: number;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Sekolah terdaftar"
        nilai={bilangan(jumlahSekolah)}
        keterangan="Seluruh sekolah dalam sistem"
        icon={Building2}
        aksen="primary"
      />
      <StatCard
        label="Total siswa"
        nilai={bilangan(total.siswa)}
        keterangan={`${bilangan(total.rombel)} rombel · kapasitas ${bilangan(total.kapasitas)} kursi`}
        icon={Users}
        aksen="info"
      />
      <StatCard
        label="Rasio siswa : guru"
        nilai={`1 : ${rasio(total.siswa, total.guru)}`}
        keterangan={`${bilangan(total.siswa)} siswa · ${bilangan(total.guru)} guru`}
        icon={GraduationCap}
        aksen="success"
      />
      <StatCard
        label="Kehadiran siswa"
        nilai={total.kehadiran}
        satuan="%"
        keterangan={`${bilangan(total.kehadiranSampel)} catatan presensi`}
        icon={CalendarCheck}
        aksen="success"
      />
      <StatCard
        label="Kehadiran guru"
        nilai={kehadiranGuru > 0 ? bilangan(kehadiranGuru) : "—"}
        satuan={kehadiranGuru > 0 ? "check-in" : ""}
        keterangan={
          kehadiranGuru > 0
            ? "Dari catatan smart gate / absensi"
            : "Belum ada catatan presensi guru"
        }
        icon={UserCheck}
        aksen="info"
      />
      <StatCard
        label="Kapasitas sekolah"
        nilai={total.utilisasi}
        satuan="%"
        keterangan={`${bilangan(total.siswa)} siswa dari ${bilangan(total.kapasitas)} kursi`}
        icon={Building2}
        aksen="warning"
      />
      <StatCard
        label="Serapan anggaran"
        nilai={total.serapan}
        satuan="%"
        keterangan={`${rupiah(total.realisasi)} dari ${rupiah(total.pagu)}`}
        icon={Wallet}
        aksen="primary"
      />
      <StatCard
        label="Perangkat online"
        nilai={`${bilangan(total.perangkatOnline)}/${bilangan(total.perangkat)}`}
        keterangan={`${bilangan(total.perangkat - total.perangkatOnline)} perangkat offline`}
        icon={Cpu}
        aksen="info"
      />
    </section>
  );
}

function SorotanPengawasan({ sekolah }: { sekolah: Sekolah[] }) {
  const belumLapor = sekolah.filter((s) => !s.adaData).length;
  const kelebihanKapasitas = sekolah.filter((s) => s.utilisasi > 100).length;
  const rasioTertinggi = sekolah
    .filter((s) => s.guru > 0)
    .sort((a, b) => b.siswa / b.guru - a.siswa / a.guru)[0];
  const perangkatOffline = sekolah.reduce((n, s) => n + (s.perangkat - s.perangkatOnline), 0);
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground">Sorotan pengawasan</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Ringkasan yang perlu diperhatikan pimpinan tanpa daftar insiden atau status KPI operasional.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-data text-[11px] uppercase tracking-wide text-muted-foreground">
            Sekolah belum lapor
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{belumLapor}</p>
        </div>
        <div>
          <p className="font-data text-[11px] uppercase tracking-wide text-muted-foreground">
            Sekolah di atas kapasitas
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {kelebihanKapasitas}
          </p>
        </div>
        <div>
          <p className="font-data text-[11px] uppercase tracking-wide text-muted-foreground">
            Beban guru tertinggi
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {rasioTertinggi ? `1 : ${rasio(rasioTertinggi.siswa, rasioTertinggi.guru)}` : "—"}
          </p>
          {rasioTertinggi ? (
            <p className="text-[11px] text-muted-foreground">{rasioTertinggi.nama}</p>
          ) : null}
        </div>
        <div>
          <p className="font-data text-[11px] uppercase tracking-wide text-muted-foreground">
            Perangkat offline
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {bilangan(perangkatOffline)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Kapasitas dihitung 32 siswa per rombel bila kolom kapasitas belum diisi sekolah.
      </p>
    </Card>
  );
}

const DERAJAT = Math.PI / 180;

/** Menaruh persentase di tengah tiap sektor donut. */
function labelPersenSektor(props: unknown) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, index } = props as {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number;
  };
  const jari = innerRadius + (outerRadius - innerRadius) * 0.62;
  const x = cx + jari * Math.cos(-midAngle * DERAJAT);
  const y = cy + jari * Math.sin(-midAngle * DERAJAT);
  return (
    <text
      x={x}
      y={y}
      fill={index === 3 ? "var(--color-foreground)" : "#ffffff"}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
      style={{ pointerEvents: "none" }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

function GrafikKomposisiGuru({
  data,
  judul = "Komposisi guru",
}: {
  data: Array<{ status: string; jumlah: number }>;
  judul?: string;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground">{judul}</h2>
      <p className="mb-2 text-xs text-muted-foreground">
        Berdasarkan status kepegawaian (PNS, PPPK, honorer, dan lainnya).
      </p>
      {data.length === 0 ? (
        <p className="py-10 text-center text-xs text-muted-foreground">Belum ada data guru.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="jumlah"
                nameKey="status"
                innerRadius={48}
                outerRadius={88}
                paddingAngle={2}
                label={labelPersenSektor}
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={WARNA_GRAFIK[i % WARNA_GRAFIK.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
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
      <h2 className="text-sm font-semibold text-foreground">Tren kehadiran & anggaran</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Rata-rata kehadiran dan serapan dari data yang tersedia di sekolah.
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
        { judul: "Siswa", kanan: true, render: (s) => bilangan(s.siswa) },
        { judul: "Guru", kanan: true, render: (s) => bilangan(s.guru) },
        { judul: "Rasio", kanan: true, render: (s) => `1 : ${rasio(s.siswa, s.guru)}` },
        { judul: "Hadir", kanan: true, render: (s) => `${s.kehadiran}%` },
        { judul: "Kapasitas", kanan: true, render: (s) => `${s.utilisasi}%` },
        {
          judul: "Perangkat",
          kanan: true,
          render: (s) => `${s.perangkatOnline}/${s.perangkat}`,
        },
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

function Kosong({ pesan }: { pesan: string }) {
  return (
    <div className="m-3 rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
      {pesan}
    </div>
  );
}

/** Landing page eksekutif untuk akun pusat. */
export function BerandaPusat() {
  const { data, galat } = penggunaSnapshot();
  return (
    <AppShell>
      <PageHeader
        judul="Ringkasan Eksekutif Sekolah"
        deskripsi="Gambaran gabungan seluruh sekolah, dengan fokus pada cakupan, kapasitas, dan kesiapan operasional."
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
          <KartuRingkas
            total={data.total}
            jumlahSekolah={data.sekolah.length}
            kehadiranGuru={data.kehadiranGuru}
          />
          <SorotanPengawasan sekolah={data.sekolah} />
          <div className="grid gap-4 lg:grid-cols-2">
            <GrafikSekolah sekolah={data.sekolah} />
            <GrafikKomposisiGuru data={data.komposisiGuru} />
          </div>
          <GrafikTren tren={data.tren} />
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
        deskripsi="Agregasi data seluruh sekolah untuk pengawasan daerah. Baca saja."
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
          <KartuRingkas
            total={data.total}
            jumlahSekolah={data.sekolah.length}
            kehadiranGuru={data.kehadiranGuru}
          />
          <SorotanPengawasan sekolah={data.sekolah} />
          <div className="grid gap-4 lg:grid-cols-2">
            <GrafikSekolah sekolah={data.sekolah} />
            <GrafikKomposisiGuru data={data.komposisiGuru} />
          </div>
          <GrafikTren tren={data.tren} />
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
              aksen="info"
            />
            <StatCard
              label="Guru"
              nilai={bilangan(data.metrik.guru)}
              keterangan="Tenaga pengajar tercatat"
              icon={GraduationCap}
              aksen="primary"
            />
            <StatCard
              label="Rasio siswa : guru"
              nilai={`1 : ${rasio(data.metrik.siswa, data.metrik.guru)}`}
              keterangan={`${bilangan(data.metrik.siswa)} siswa · ${bilangan(data.metrik.guru)} guru`}
              icon={GraduationCap}
              aksen="success"
            />
            <StatCard
              label="Kapasitas kelas"
              nilai={data.metrik.utilisasi}
              satuan="%"
              keterangan={`${bilangan(data.metrik.siswa)} dari ${bilangan(data.metrik.kapasitas)} kursi`}
              icon={Building2}
              aksen="warning"
            />
            <StatCard
              label="Kehadiran siswa"
              nilai={data.metrik.kehadiran}
              satuan="%"
              keterangan={`${bilangan(data.metrik.kehadiranSampel)} catatan`}
              icon={CalendarCheck}
              aksen="success"
            />
            <StatCard
              label="Kehadiran guru"
              nilai={data.kehadiranGuru.length > 0 ? bilangan(data.kehadiranGuru.length) : "—"}
              satuan={data.kehadiranGuru.length > 0 ? "hari" : ""}
              keterangan="Hari dengan catatan masuk guru"
              icon={UserCheck}
              aksen="info"
            />
            <StatCard
              label="Perangkat online"
              nilai={`${bilangan(data.metrik.perangkatOnline)}/${bilangan(data.metrik.perangkat)}`}
              keterangan={`${bilangan(data.metrik.perangkat - data.metrik.perangkatOnline)} offline`}
              icon={Cpu}
              aksen="info"
            />
            <StatCard
              label="Serapan anggaran"
              nilai={data.metrik.serapan}
              satuan="%"
              keterangan={`${rupiah(data.metrik.realisasi)} dari ${rupiah(data.metrik.pagu)}`}
              icon={Wallet}
              aksen="primary"
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <TabelData
              judul="Siswa & kapasitas per kelas"
              deskripsi="Perbandingan jumlah siswa dengan kapasitas rombel."
              data={data.kelas}
              kolom={[
                { judul: "Kelas", render: (k) => k.nama },
                { judul: "Siswa", kanan: true, render: (k) => bilangan(k.siswa) },
                { judul: "Kapasitas", kanan: true, render: (k) => bilangan(k.kapasitas) },
                {
                  judul: "Terisi",
                  kanan: true,
                  render: (k) => `${Math.round((k.siswa / Math.max(1, k.kapasitas)) * 100)}%`,
                },
              ]}
            />
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Kehadiran siswa per tanggal
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Persentase hadir dan terlambat dari catatan presensi.
                </p>
              </div>
              {data.kehadiran.length === 0 ? (
                <Kosong pesan="Belum ada catatan kehadiran siswa." />
              ) : (
                <TabelData
                  judul="Presensi siswa"
                  data={data.kehadiran}
                  kolom={[
                    { judul: "Tanggal", render: (h) => h.tanggal },
                    { judul: "Catatan", kanan: true, render: (h) => bilangan(h.total) },
                    { judul: "Hadir", kanan: true, render: (h) => `${h.persen}%` },
                  ]}
                />
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Kehadiran guru per tanggal
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Dari catatan smart gate / absensi ASN yang tersedia.
                </p>
              </div>
              {data.kehadiranGuru.length === 0 ? (
                <Kosong pesan="Belum ada catatan kehadiran guru. Data akan muncul saat smart gate atau absensi ASN terhubung." />
              ) : (
                <TabelData
                  judul="Presensi guru"
                  data={data.kehadiranGuru}
                  kolom={[
                    { judul: "Tanggal", render: (h) => h.tanggal },
                    { judul: "Guru masuk", kanan: true, render: (h) => bilangan(h.hadir) },
                  ]}
                />
              )}
            </Card>
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

          <div className="grid gap-4 lg:grid-cols-2">
            <GrafikKomposisiGuru data={data.komposisiGuru} judul="Komposisi guru sekolah ini" />
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
      ) : null}
    </AppShell>
  );
}
