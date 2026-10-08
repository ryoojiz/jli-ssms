import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  ClipboardList,
  Cpu,
  HeartPulse,
  Users,
  Wallet,
} from "lucide-react";
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
import { StatCard } from "@/components/stat-card";
import { IntegrasiSistem } from "@/components/integrasi-sistem";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { announcementVisible, todayLocal, useDemoWorkflow, type AnnouncementTarget } from "@/lib/demo-workflow";
import {
  ANGGARAN,
  DISTRIBUSI_NILAI,
  INSIDEN,
  NOTIFIKASI,
  PERANGKAT,
  TREN_KEHADIRAN,
  NILAI,
  PENGUMUMAN,
  PRESENSI_HARI_INI,
  SISWA,
  SIRKULASI,
  TUGAS,
  rasioGuruSiswa,
  rekapPresensi,
  ringkasan,
  rupiah,
} from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "School Command Center — SMS Sekolah" },
      {
        name: "description",
        content:
          "Pusat kendali sekolah: KPI kehadiran, akademik, keuangan, perpustakaan, kesehatan, keamanan, dan status perangkat IoT dalam satu layar.",
      },
      { property: "og:title", content: "School Command Center — SMS Sekolah" },
      {
        property: "og:description",
        content: "Satu layar untuk memantau seluruh operasional sekolah secara real time.",
      },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  const { sesi } = useAuth();
  if (sesi?.peran === "walimurid") return <BerandaWaliMurid />;

  const r = ringkasan();
  const rekap = rekapPresensi();
  const rasio = rasioGuruSiswa();

  return (
    <AppShell>
      <PageHeader
        judul="School Command Center"
        deskripsi="Ringkasan operasional dari data contoh 4 September 2026 (Asia/Jakarta), bukan pemantauan langsung."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Kehadiran contoh · 4 Sep 2026"
          nilai={r.persenHadir}
          satuan="%"
          keterangan={`${rekap[0]!.jumlah} hadir · ${rekap[1]!.jumlah} terlambat · ${rekap[4]!.jumlah} alfa`}
          icon={CalendarCheck}
        />
        <StatCard
          label="Siswa & guru aktif"
          nilai={r.totalSiswa}
          keterangan={`${r.totalGuru} guru · ${r.totalKelas} rombel`}
          icon={Users}
        />
        <StatCard
          label="Serapan anggaran"
          nilai={r.persenSerapan}
          satuan="%"
          keterangan={`${rupiah(r.totalRealisasi)} dari ${rupiah(r.totalPagu)}`}
          icon={Wallet}
        />
        <StatCard
          label="Perangkat IoT online"
          nilai={`${r.perangkatOnline}/${r.totalPerangkat}`}
          keterangan="CCTV, smart gate, RFID reader, sensor"
          icon={Cpu}
        />
      </section>

      <IntegrasiSistem />

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tugas aktif" nilai={r.tugasAktif} keterangan="Menunggu pengumpulan siswa" icon={ClipboardList} />
        <StatCard label="Buku dipinjam" nilai={r.bukuDipinjam} keterangan="Termasuk 1 keterlambatan" icon={BookOpen} />
        <StatCard label="Kunjungan UKS" nilai={r.kunjunganUks} keterangan="1 rujukan ke Puskesmas" icon={HeartPulse} />
        <StatCard label="Insiden terbuka" nilai={r.insidenTerbuka} keterangan="Perlu tindak lanjut security" icon={AlertTriangle} />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 sm:col-span-2 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Rasio guru vs siswa</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {rasio.totalGuru} guru mengampu {rasio.totalSiswa} siswa aktif.
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{rasio.teks}</span>
                <StatusPill nada={rasio.dibulatkan <= 20 ? "success" : "warning"}>
                  {rasio.rekomendasi}
                </StatusPill>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Standar ideal Kemendikbud: 1 guru untuk maksimal 20 siswa.
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Komposisi guru</h2>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">PNS</span>
              <span className="font-semibold text-foreground">{rasio.guruPns}</span>
            </li>
            <li className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">PPPK</span>
              <span className="font-semibold text-foreground">{rasio.guruPppk}</span>
            </li>
            <li className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Honorer</span>
              <span className="font-semibold text-foreground">{rasio.guruHonorer}</span>
            </li>
          </ul>
          <Link to="/akademik" className="mt-5 inline-block text-xs font-semibold text-primary hover:underline">
            Lihat data guru →
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Beban rata-rata</h2>
          <p className="mt-1 text-xs text-muted-foreground">Siswa per guru saat ini.</p>
          <div className="mt-4 text-3xl font-bold text-foreground">{rasio.dibulatkan}</div>
          <p className="mt-3 text-xs text-muted-foreground">
            {rasio.dibulatkan <= 20
              ? "Rasio masih dalam batas kenyamanan pembelajaran."
              : "Pertimbangkan penambahan tenaga pengajar."}
          </p>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Tren kehadiran mingguan</h2>
          <p className="mb-4 text-xs text-muted-foreground">Persentase kehadiran seluruh rombel.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREN_KEHADIRAN}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hari" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis domain={[85, 100]} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Kehadiran"]}
                  contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="persen"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Distribusi nilai</h2>
          <p className="mb-4 text-xs text-muted-foreground">Seluruh mata pelajaran, semester berjalan.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DISTRIBUSI_NILAI}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="rentang" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  formatter={(v: number) => [`${v} nilai`, "Jumlah"]}
                  contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)", fontSize: 12 }}
                />
                <Bar dataKey="jumlah" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Serapan anggaran per program</h2>
          <ul className="mt-4 space-y-4">
            {ANGGARAN.map((a) => {
              const persen = Math.round((a.realisasi / a.pagu) * 100);
              return (
                <li key={a.id}>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="font-medium text-foreground">{a.program}</span>
                    <span className="tabular-nums text-muted-foreground">{persen}%</span>
                  </div>
                  <Progress value={persen} className="mt-1.5 h-2" />
                </li>
              );
            })}
          </ul>
          <Link to="/keuangan" className="mt-5 inline-block text-xs font-semibold text-primary hover:underline">
            Lihat modul Keuangan →
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Insiden keamanan terbaru</h2>
          <ul className="mt-4 space-y-3">
            {INSIDEN.map((i) => (
              <li key={i.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{i.jenis}</p>
                  <StatusPill nada={nadaStatus(i.status)}>{i.status}</StatusPill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {i.lokasi} · {i.sumber} · {i.waktu}
                </p>
              </li>
            ))}
          </ul>
          <Link to="/keamanan" className="mt-5 inline-block text-xs font-semibold text-primary hover:underline">
            Lihat Smart Security →
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Contoh riwayat notifikasi · tidak dikirim demo</h2>
          <ul className="mt-4 space-y-3">
            {NOTIFIKASI.map((n) => (
              <li key={n.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{n.penerima}</p>
                  <StatusPill nada={nadaStatus(n.status)}>{n.status}</StatusPill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.kanal} · {n.waktu} — {n.isi}
                </p>
              </li>
            ))}
          </ul>
          <Link to="/komunikasi" className="mt-5 inline-block text-xs font-semibold text-primary hover:underline">
            Lihat modul Komunikasi →
          </Link>
        </Card>
      </section>

      <section className="mt-4">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Status perangkat & infrastruktur</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PERANGKAT.map((d) => (
              <div key={d.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{d.nama}</p>
                  <StatusPill nada={nadaStatus(d.status)}>{d.status}</StatusPill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.tipe} · {d.lokasi} · {d.terakhir}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}

function BerandaWaliMurid() {
  const { sesi } = useAuth();
  const workflow = useDemoWorkflow();
  const anak = SISWA.find((s) => s.id === sesi?.siswaId);
  if (!anak) return <AppShell><PageHeader judul="Beranda Anak" deskripsi="Akun demo ini belum terhubung ke data anak." /></AppShell>;
  const tanggal = todayLocal();
  const perubahan = workflow.attendance.find((item) => item.siswaId === anak.id && item.date === tanggal);
  const presensi = perubahan
    ? { status: perubahan.status, jam: "-" }
    : PRESENSI_HARI_INI.find((p) => p.siswaId === anak.id && p.tanggal === tanggal);
  const belumDibaca = workflow.notifications.filter((item) => item.siswaId === anak.id && !workflow.readIds.includes(item.id)).length;
  const demoAnnouncements = workflow.announcements.map((item) => ({ id: item.id, judul: item.title, isi: item.body, target: item.target }));
  const pengumuman = [...demoAnnouncements, ...PENGUMUMAN].filter((item) => sesi && announcementVisible(item.target as AnnouncementTarget, sesi));
  const nilai = NILAI.filter((n) => n.siswaId === anak.id);
  const rataRata = nilai.length
    ? Math.round(nilai.reduce((jumlah, item) => jumlah + item.nilai, 0) / nilai.length)
    : 0;
  const tugas = TUGAS.filter((t) => t.kelasId === anak.kelasId && t.status === "Aktif");
  const pinjaman = SIRKULASI.filter((s) => s.peminjam === anak.nama && s.status !== "Dikembalikan");

  return (
    <AppShell>
      <PageHeader
        judul={`Beranda ${anak.nama}`}
        deskripsi={`Informasi anak Anda · Kelas ${anak.kelasId.replace("K", "")} · NISN ${anak.nisn}`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Kehadiran ${tanggal}`} nilai={presensi?.status ?? "Belum tercatat"} keterangan={presensi?.jam && presensi.jam !== "-" ? `Tercatat pukul ${presensi.jam}` : "Lihat catatan dan pengajuan di Kehadiran"} icon={CalendarCheck} />
        <StatCard label="Rata-rata nilai" nilai={rataRata} keterangan={`${nilai.length} mata pelajaran tercatat`} icon={GraduationCap} />
        <StatCard label="Tugas aktif" nilai={tugas.length} keterangan="Untuk kelas anak Anda" icon={ClipboardList} />
        <StatCard label="Buku dipinjam" nilai={pinjaman.length} keterangan="Peminjaman milik anak Anda" icon={BookOpen} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Nilai terbaru</h2>
          <ul className="mt-4 space-y-3">
            {nilai.map((item) => (
              <li key={item.mapel} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-foreground">{item.mapel}</span>
                <StatusPill nada={item.nilai >= 80 ? "baik" : item.nilai >= 70 ? "peringatan" : "bahaya"}>{item.nilai}</StatusPill>
              </li>
            ))}
          </ul>
          <Link to="/akademik" className="mt-5 inline-block text-xs font-semibold text-primary hover:underline">Lihat akademik anak →</Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Informasi sekolah · {belumDibaca} pembaruan belum dibaca</h2>
          <ul className="mt-4 space-y-3">
            {pengumuman.slice(0, 3).map((p) => (
              <li key={p.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium text-foreground">{p.judul}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.isi}</p>
              </li>
            ))}
          </ul>
          <Link to="/komunikasi" className="mt-5 inline-block text-xs font-semibold text-primary hover:underline">Lihat semua informasi →</Link>
        </Card>
      </section>
    </AppShell>
  );
}
