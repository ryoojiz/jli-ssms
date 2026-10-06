import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Clock, FileWarning, ScanLine } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { useDataCloud } from "@/lib/data-cloud";
import {
  IZIN,
  KELAS,
  PRESENSI_HARI_INI,
  SISWA,
  TREN_KEHADIRAN,
  namaKelas,
  rekapPresensi,
  type Presensi,
} from "@/lib/demo-data";

export const Route = createFileRoute("/kehadiran")({
  head: () => ({
    meta: [
      { title: "Kehadiran — Presensi QR/RFID & Rekap | SMS" },
      {
        name: "description",
        content:
          "Presensi harian siswa via QR, RFID, dan face recognition, pengajuan izin/sakit, rekap kehadiran, serta notifikasi otomatis ke orang tua.",
      },
      { property: "og:title", content: "Modul Kehadiran — SMS Sekolah" },
      {
        property: "og:description",
        content: "Presensi multi-kanal, izin, rekap kelas, dan notifikasi wali murid.",
      },
    ],
  }),
  component: Kehadiran,
});

function Kehadiran() {
  const { sesi } = useAuth();
  useDataCloud();
  const waliMurid = sesi?.peran === "walimurid";
  const [kelasId, setKelasId] = useState("K5A");
  const siswaKelas = SISWA.filter((s) => s.kelasId === kelasId && (!waliMurid || s.id === sesi.siswaId));
  const presensiKelas = siswaKelas.map((s) => ({
    siswa: s,
    presensi: PRESENSI_HARI_INI.find((p) => p.siswaId === s.id),
  })).filter((r): r is { siswa: (typeof SISWA)[number]; presensi: Presensi } => r.presensi !== undefined);
  const rekap = rekapPresensi(waliMurid ? presensiKelas.map((r) => r.presensi) : PRESENSI_HARI_INI);

  const perKelas = KELAS.map((k) => {
    const list = PRESENSI_HARI_INI.filter((p) => p.siswaId.startsWith(k.id));
    const hadir = list.filter((p) => p.status === "Hadir" || p.status === "Terlambat").length;
    return { kelas: k.nama, persen: Math.round((hadir / list.length) * 100) };
  });

  return (
    <AppShell>
      <PageHeader
        judul={waliMurid ? "Kehadiran Anak" : "Kehadiran"}
        deskripsi={waliMurid ? `Catatan kehadiran ${siswaKelas[0]?.nama ?? "anak Anda"}.` : "Presensi harian multi-kanal (QR, RFID, face recognition, manual), izin, dan rekap."}
        aksi={
          waliMurid ? undefined : <Select value={kelasId} onValueChange={setKelasId}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KELAS.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  Kelas {k.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Hadir" nilai={rekap[0]!.jumlah} keterangan="Tercatat tepat waktu" icon={CalendarCheck} />
        <StatCard label="Terlambat" nilai={rekap[1]!.jumlah} keterangan="Masuk setelah 07:15" icon={Clock} />
        <StatCard label="Izin & sakit" nilai={rekap[2]!.jumlah + rekap[3]!.jumlah} keterangan="Dengan keterangan wali" icon={FileWarning} />
        <StatCard label="Alfa" nilai={rekap[4]!.jumlah} keterangan="Notifikasi otomatis dikirim" icon={ScanLine} />
      </section>

      {!waliMurid ? <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Kehadiran per rombel hari ini</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perKelas}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="kelas" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Kehadiran"]}
                  contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)", fontSize: 12 }}
                />
                <Bar dataKey="persen" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Tren mingguan</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TREN_KEHADIRAN}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hari" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis domain={[85, 100]} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Kehadiran"]}
                  contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)", fontSize: 12 }}
                />
                <Bar dataKey="persen" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section> : null}

      <Tabs defaultValue="presensi" className="mt-6">
        <TabsList>
          <TabsTrigger value="presensi">Presensi harian</TabsTrigger>
          <TabsTrigger value="izin">Izin & sakit</TabsTrigger>
        </TabsList>

        <TabsContent value="presensi" className="mt-4">
          <TabelData
            judul={`Presensi kelas ${namaKelas(kelasId)} — 4 September 2026`}
            deskripsi="Sumber data: pemindaian kartu RFID, QR, face recognition, dan input manual wali kelas."
            data={presensiKelas}
            kolom={[
              { judul: "NISN", render: (r) => r.siswa.nisn },
              { judul: "Nama", render: (r) => <span className="font-medium">{r.siswa.nama}</span> },
              { judul: "Tag", render: (r) => r.siswa.tagUid },
              { judul: "Jam masuk", render: (r) => r.presensi.jam },
              { judul: "Sumber", render: (r) => <StatusPill>{r.presensi.sumber}</StatusPill> },
              {
                judul: "Status",
                render: (r) => (
                  <StatusPill nada={nadaStatus(r.presensi.status)}>{r.presensi.status}</StatusPill>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="izin" className="mt-4">
          <TabelData
            judul="Pengajuan izin & sakit"
            deskripsi="Pengajuan dari orang tua melalui aplikasi, menunggu verifikasi wali kelas."
            data={waliMurid ? IZIN.filter((i) => i.siswa === siswaKelas[0]?.nama) : IZIN}
            kolom={[
              { judul: "ID", render: (i) => i.id },
              { judul: "Siswa", render: (i) => <span className="font-medium">{i.siswa}</span> },
              { judul: "Kelas", render: (i) => i.kelas },
              { judul: "Jenis", render: (i) => i.jenis },
              { judul: "Tanggal", render: (i) => i.tanggal },
              { judul: "Keterangan", render: (i) => i.keterangan },
              { judul: "Status", render: (i) => <StatusPill nada={nadaStatus(i.status)}>{i.status}</StatusPill> },
            ]}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
