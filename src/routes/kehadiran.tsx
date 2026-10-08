import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Clock, FileWarning, ScanLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  canManageAttendance,
  createLeaveRequest,
  formatDemoDateTime,
  recordAttendance,
  reviewLeaveRequest,
  todayLocal,
  useDemoWorkflow,
} from "@/lib/demo-workflow";
import {
  IZIN,
  KELAS,
  PRESENSI_HARI_INI,
  SISWA,
  TREN_KEHADIRAN,
  STATUS_HADIR,
  namaKelas,
  rekapPresensi,
  type Presensi,
} from "@/lib/demo-data";

export const Route = createFileRoute("/kehadiran")({
  head: () => ({
    meta: [
      { title: "Kehadiran — Catatan & Izin Demo | SSMS" },
      {
        name: "description",
        content:
          "Demo pencatatan kehadiran, pengajuan izin/sakit, peninjauan wali kelas, dan pembaruan dalam aplikasi untuk wali murid.",
      },
      { property: "og:title", content: "Modul Kehadiran — SMS Sekolah" },
      {
        property: "og:description",
        content:
          "Pencatatan manual demo, izin, rekap kelas, dan pembaruan dalam aplikasi untuk wali murid.",
      },
    ],
  }),
  component: Kehadiran,
});

function Kehadiran() {
  const { sesi } = useAuth();
  useDataCloud();
  const workflow = useDemoWorkflow();
  const waliMurid = sesi?.peran === "walimurid";
  const siswaAnak = SISWA.find((s) => s.id === sesi?.siswaId);
  const kelasWali =
    sesi?.peran === "wali_kelas" ? KELAS.find((k) => canManageAttendance(sesi, k.id)) : undefined;
  const [kelasId, setKelasId] = useState(kelasWali?.id ?? "K5A");
  const [tanggal, setTanggal] = useState(todayLocal);
  const [jenis, setJenis] = useState<"Izin" | "Sakit">("Izin");
  const [alasan, setAlasan] = useState("");
  const [tanggalIzin, setTanggalIzin] = useState(todayLocal);
  const kelasAktif = waliMurid ? (siswaAnak?.kelasId ?? kelasId) : (kelasWali?.id ?? kelasId);
  const siswaKelas = SISWA.filter(
    (s) => s.kelasId === kelasAktif && (!waliMurid || s.id === sesi?.siswaId),
  );
  const presensiKelas = siswaKelas.map((s) => {
    const change = workflow.attendance.find((p) => p.siswaId === s.id && p.date === tanggal);
    const sample = PRESENSI_HARI_INI.find((p) => p.siswaId === s.id && p.tanggal === tanggal);
    const presensi: Presensi | undefined = change
      ? { siswaId: s.id, tanggal, status: change.status, jam: "-", sumber: "Manual" }
      : sample;
    return { siswa: s, presensi, change };
  });
  const rekap = rekapPresensi(presensiKelas.flatMap((r) => (r.presensi ? [r.presensi] : [])));
  const canEdit = Boolean(sesi && canManageAttendance(sesi, kelasAktif));
  const requests = workflow.requests.filter((r) =>
    waliMurid ? r.siswaId === sesi?.siswaId : r.kelasId === kelasAktif,
  );

  function ajukanIzin() {
    if (!sesi) return;
    try {
      createLeaveRequest(sesi, jenis, tanggalIzin, alasan);
      setAlasan("");
      toast.success("Pengajuan demo tersimpan di browser ini.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pengajuan gagal.");
    }
  }

  function putuskan(requestId: string, decision: "Disetujui" | "Ditolak") {
    if (!sesi) return;
    try {
      reviewLeaveRequest(sesi, requestId, decision);
      toast.success(`Pengajuan ${decision.toLowerCase()}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Peninjauan gagal.");
    }
  }

  function catat(siswaId: string, status: (typeof STATUS_HADIR)[number]) {
    if (!sesi) return;
    try {
      recordAttendance(sesi, siswaId, tanggal, status);
      toast.success("Kehadiran demo diperbarui.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pencatatan gagal.");
    }
  }

  const perKelas = KELAS.map((k) => {
    const list = PRESENSI_HARI_INI.filter(
      (p) => p.siswaId.startsWith(k.id) && p.tanggal === "2026-09-04",
    );
    const hadir = list.filter((p) => p.status === "Hadir" || p.status === "Terlambat").length;
    return { kelas: k.nama, persen: list.length ? Math.round((hadir / list.length) * 100) : 0 };
  });

  return (
    <AppShell>
      <PageHeader
        judul={waliMurid ? "Kehadiran Anak" : "Kehadiran"}
        deskripsi={
          waliMurid
            ? `Catatan kehadiran ${siswaAnak?.nama ?? "anak Anda"} dan pengajuan izin. Demo tersimpan hanya di browser ini.`
            : "Pencatatan manual, peninjauan izin, dan rekap demo. Data perangkat pada tanggal contoh bersifat statis."
        }
        aksi={
          waliMurid || kelasWali ? undefined : (
            <Select value={kelasId} onValueChange={setKelasId}>
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
          )
        }
      />

      <Card className="mb-5 flex flex-wrap items-end gap-3 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="tanggal-kehadiran">Tanggal kehadiran</Label>
          <Input
            id="tanggal-kehadiran"
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-48"
          />
        </div>
        <Button variant="outline" onClick={() => setTanggal("2026-09-04")}>
          Lihat data contoh 4 Sep 2026
        </Button>
        <p className="text-xs text-muted-foreground">
          Perubahan demo tidak mengubah data impor Cloud dan tidak terkirim ke perangkat atau wali
          murid lain.
        </p>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Hadir"
          nilai={rekap[0]!.jumlah}
          keterangan={`Kelas ${namaKelas(kelasAktif)} · ${tanggal}`}
          icon={CalendarCheck}
        />
        <StatCard
          label="Terlambat"
          nilai={rekap[1]!.jumlah}
          keterangan="Pada tanggal terpilih"
          icon={Clock}
        />
        <StatCard
          label="Izin & sakit"
          nilai={rekap[2]!.jumlah + rekap[3]!.jumlah}
          keterangan="Pada tanggal terpilih"
          icon={FileWarning}
        />
        <StatCard
          label="Alfa"
          nilai={rekap[4]!.jumlah}
          keterangan="Belum tercatat tidak dihitung alfa"
          icon={ScanLine}
        />
      </section>

      {!waliMurid ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Contoh kehadiran per rombel · 4 Sep 2026
            </h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perKelas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="kelas"
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Kehadiran"]}
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: "var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="persen" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Contoh tren mingguan · data sintetis
            </h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TREN_KEHADIRAN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="hari"
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    domain={[85, 100]}
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Kehadiran"]}
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: "var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="persen" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      ) : null}

      <Tabs defaultValue="presensi" className="mt-6">
        <TabsList>
          <TabsTrigger value="presensi">Presensi harian</TabsTrigger>
          <TabsTrigger value="izin">Izin & sakit</TabsTrigger>
        </TabsList>

        <TabsContent value="presensi" className="mt-4">
          <TabelData
            judul={`Presensi kelas ${namaKelas(kelasAktif)} — ${tanggal}`}
            deskripsi="Data contoh 4 Sep 2026 hanya ilustrasi. Perubahan manual disimpan di browser ini; siswa tanpa catatan tidak dianggap alfa."
            data={presensiKelas}
            kolom={[
              { judul: "NISN", render: (r) => r.siswa.nisn },
              { judul: "Nama", render: (r) => <span className="font-medium">{r.siswa.nama}</span> },
              { judul: "Jam masuk", render: (r) => r.presensi?.jam ?? "—" },
              {
                judul: "Sumber",
                render: (r) =>
                  r.presensi ? (
                    <StatusPill>{r.change ? "Input demo" : "Data contoh"}</StatusPill>
                  ) : (
                    "—"
                  ),
              },
              {
                judul: "Status",
                render: (r) =>
                  r.presensi ? (
                    <StatusPill nada={nadaStatus(r.presensi.status)}>
                      {r.presensi.status}
                    </StatusPill>
                  ) : (
                    <span className="text-muted-foreground">Belum dicatat</span>
                  ),
              },
              {
                judul: "Perubahan",
                render: (r) =>
                  r.change ? (
                    <span className="text-xs">
                      {r.change.changedBy}
                      <br />
                      {formatDemoDateTime(r.change.changedAt)}
                    </span>
                  ) : (
                    "—"
                  ),
              },
              {
                judul: "Catat / koreksi",
                render: (r) =>
                  canEdit ? (
                    <Select
                      value={r.presensi?.status ?? ""}
                      onValueChange={(value) => {
                        if (value !== r.presensi?.status)
                          catat(r.siswa.id, value as (typeof STATUS_HADIR)[number]);
                      }}
                    >
                      <SelectTrigger
                        className="w-36"
                        aria-label={`Status kehadiran ${r.siswa.nama}`}
                      >
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_HADIR.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="izin" className="mt-4">
          {waliMurid ? (
            <Card className="mb-4 space-y-4 p-5">
              <div>
                <h2 className="font-semibold">Ajukan izin atau sakit</h2>
                <p className="text-xs text-muted-foreground">
                  Untuk {siswaAnak?.nama ?? "anak terhubung"}. Gunakan data contoh saja; lampiran
                  belum didukung.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="jenis-izin">Jenis</Label>
                  <Select
                    value={jenis}
                    onValueChange={(value) => setJenis(value as "Izin" | "Sakit")}
                  >
                    <SelectTrigger id="jenis-izin">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Izin">Izin</SelectItem>
                      <SelectItem value="Sakit">Sakit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tanggal-izin">Tanggal</Label>
                  <Input
                    id="tanggal-izin"
                    type="date"
                    value={tanggalIzin}
                    onChange={(e) => setTanggalIzin(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alasan-izin">Alasan</Label>
                <Textarea
                  id="alasan-izin"
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  maxLength={500}
                  placeholder="Tuliskan alasan singkat tanpa data medis sensitif."
                />
              </div>
              <Button onClick={ajukanIzin}>Kirim pengajuan demo</Button>
            </Card>
          ) : null}
          <Card className="mb-4 p-5">
            <h2 className="font-semibold">Pengajuan baru · tersimpan di browser</h2>
            {requests.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Belum ada pengajuan untuk{" "}
                {waliMurid ? "anak ini" : `kelas ${namaKelas(kelasAktif)}`}.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {requests.map((request) => {
                  const student = SISWA.find((item) => item.id === request.siswaId);
                  return (
                    <li
                      key={request.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {student?.nama ?? request.siswaId} · {request.kind} · {request.date}
                        </p>
                        <p className="text-muted-foreground">{request.note}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Diajukan {formatDemoDateTime(request.requestedAt)}
                          {request.decidedBy && request.decidedAt
                            ? ` · Ditinjau ${request.decidedBy} pada ${formatDemoDateTime(request.decidedAt!)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill nada={nadaStatus(request.status)}>{request.status}</StatusPill>
                        {canEdit && request.status === "Menunggu" ? (
                          <>
                            <Button size="sm" onClick={() => putuskan(request.id, "Disetujui")}>
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => putuskan(request.id, "Ditolak")}
                            >
                              Tolak
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <TabelData
            judul="Contoh pengajuan historis"
            deskripsi="Data statis untuk ilustrasi; tidak terhubung ke alur persetujuan demo."
            data={waliMurid ? IZIN.filter((i) => i.siswa === siswaKelas[0]?.nama) : IZIN}
            kolom={[
              { judul: "ID", render: (i) => i.id },
              { judul: "Siswa", render: (i) => <span className="font-medium">{i.siswa}</span> },
              { judul: "Kelas", render: (i) => i.kelas },
              { judul: "Jenis", render: (i) => i.jenis },
              { judul: "Tanggal", render: (i) => i.tanggal },
              { judul: "Keterangan", render: (i) => i.keterangan },
              {
                judul: "Status",
                render: (i) => <StatusPill nada={nadaStatus(i.status)}>{i.status}</StatusPill>,
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
