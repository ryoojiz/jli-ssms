import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Database, Download, Gauge, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
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
import { toast } from "sonner";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INGESTION,
  KPI_KATALOG,
  KUALITAS_DATA,
  LAPORAN_TERJADWAL,
  PERBANDINGAN_SEKOLAH,
  TREN_KPI,
} from "@/lib/demo-data";

export const Route = createFileRoute("/analitik")({
  head: () => ({
    meta: [
      { title: "Dashboard & Analytics — KPI Sekolah | SMS" },
      {
        name: "description",
        content:
          "Katalog KPI, tren lintas modul, perbandingan antar sekolah, monitoring kualitas data, dan laporan terjadwal untuk Kepala Sekolah dan Dinas.",
      },
      { property: "og:title", content: "Dashboard & Analytics — SMS Sekolah" },
      {
        property: "og:description",
        content: "Single pane of glass KPI sekolah: akademik, kehadiran, keuangan, keamanan, IoT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analitik,
});

const PERIODE = ["Semester Berjalan", "Bulan Ini", "Minggu Ini", "Hari Ini"];
const CAKUPAN = ["SDN 01 Kebagusan", "Seluruh Sekolah Binaan"];

function Analitik() {
  const [periode, setPeriode] = useState(PERIODE[0]!);
  const [cakupan, setCakupan] = useState(CAKUPAN[0]!);

  const peringatan = KPI_KATALOG.filter((k) => k.status !== "Normal").length;
  const dqTemuan = KUALITAS_DATA.reduce((a, b) => a + b.temuan, 0);
  const totalEvent = INGESTION.reduce((a, b) => a + b.event, 0);

  return (
    <AppShell>
      <PageHeader
        judul="Dashboard & Analytics"
        deskripsi="Single pane of glass lintas modul: katalog KPI berversi, drill-down, kualitas data, dan laporan terjadwal."
        aksi={
          <>
            <Select value={cakupan} onValueChange={setCakupan}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAKUPAN.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periode} onValueChange={setPeriode}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODE.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Ekspor disiapkan", {
                  description: `Filter aktif: ${cakupan} · ${periode} (XLSX).`,
                })
              }
            >
              <Download className="size-4" /> Ekspor
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="KPI dipantau" nilai={KPI_KATALOG.length} keterangan="Definisi berversi & ber-owner" icon={Gauge} />
        <StatCard label="KPI di luar target" nilai={peringatan} keterangan="Memicu threshold alert" icon={AlertTriangle} />
        <StatCard label="Event ter-ingest" nilai={totalEvent.toLocaleString("id-ID")} keterangan="24 jam terakhir" icon={Database} />
        <StatCard label="Temuan kualitas data" nilai={dqTemuan} keterangan="Missing, duplikat, outlier" icon={ShieldCheck} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Tren KPI utama</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Kehadiran & rata-rata nilai per periode — {periode}.
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREN_KPI}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="periode" tick={{ fontSize: 12 }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="kehadiran" name="Kehadiran (%)" stroke="var(--color-primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="nilai" name="Rata-rata nilai" stroke="var(--color-info)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Perbandingan antar sekolah</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Hanya sekolah dalam cakupan pengguna yang ditampilkan.
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PERBANDINGAN_SEKOLAH}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="sekolah" tick={{ fontSize: 10 }} interval={0} height={50} angle={-12} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="kehadiran" name="Kehadiran (%)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="serapan" name="Serapan anggaran (%)" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <div className="mt-6">
        <TabelData
          judul="Katalog KPI"
          deskripsi="Setiap KPI memiliki formula, sumber, owner, frekuensi refresh, dan versi (BR-01, BR-05)."
          data={KPI_KATALOG}
          aksi={
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Perhitungan ulang KPI dijalankan", { description: "Status refresh dicatat pada log audit." })}
            >
              <RefreshCw className="size-4" /> Refresh KPI
            </Button>
          }
          kolom={[
            { judul: "ID", render: (k) => k.id },
            {
              judul: "KPI",
              render: (k) => (
                <div>
                  <p className="font-medium">{k.nama}</p>
                  <p className="text-xs text-muted-foreground">{k.formula}</p>
                </div>
              ),
            },
            { judul: "Sumber", render: (k) => k.sumber },
            { judul: "Owner", render: (k) => k.owner },
            { judul: "Frekuensi", render: (k) => k.frekuensi },
            { judul: "Versi", render: (k) => k.versi },
            { judul: "Nilai", kanan: true, render: (k) => <span className="font-semibold">{k.nilai}</span> },
            { judul: "Target", kanan: true, render: (k) => k.target },
            { judul: "Refresh", render: (k) => k.refresh },
            { judul: "Status", render: (k) => <StatusPill nada={nadaStatus(k.status)}>{k.status}</StatusPill> },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <TabelData
          judul="Monitoring kualitas data"
          deskripsi="Deteksi data hilang, duplikasi, dan outlier per sumber (FR-09)."
          data={KUALITAS_DATA}
          kolom={[
            { judul: "Sumber", render: (d) => <span className="font-medium">{d.sumber}</span> },
            { judul: "Pemeriksaan", render: (d) => d.pemeriksaan },
            { judul: "Temuan", kanan: true, render: (d) => `${d.temuan} / amb. ${d.ambang}` },
            { judul: "Status", render: (d) => <StatusPill nada={nadaStatus(d.status)}>{d.status}</StatusPill> },
          ]}
        />

        <TabelData
          judul="Pipeline ingestion"
          deskripsi="Aliran event dan batch dari seluruh modul serta platform IoT (FR-02)."
          data={INGESTION}
          kolom={[
            { judul: "Sumber", render: (i) => <span className="font-medium">{i.sumber}</span> },
            { judul: "Metode", render: (i) => i.metode },
            { judul: "Event 24 jam", kanan: true, render: (i) => i.event.toLocaleString("id-ID") },
            { judul: "Jeda", render: (i) => i.jeda },
            { judul: "Status", render: (i) => <StatusPill nada={nadaStatus(i.status)}>{i.status}</StatusPill> },
          ]}
        />
      </div>

      <div className="mt-6">
        <TabelData
          judul="Laporan terjadwal"
          deskripsi="Distribusi laporan periodik ke penerima sesuai peran (FR-07, FR-08)."
          data={LAPORAN_TERJADWAL}
          kolom={[
            { judul: "ID", render: (r) => r.id },
            { judul: "Laporan", render: (r) => <span className="font-medium">{r.nama}</span> },
            { judul: "Format", render: (r) => r.format },
            { judul: "Jadwal", render: (r) => r.jadwal },
            { judul: "Penerima", render: (r) => r.penerima },
            { judul: "Terakhir dikirim", render: (r) => r.terakhir },
            { judul: "Status", render: (r) => <StatusPill nada={nadaStatus(r.status)}>{r.status}</StatusPill> },
          ]}
        />
      </div>
    </AppShell>
  );
}
