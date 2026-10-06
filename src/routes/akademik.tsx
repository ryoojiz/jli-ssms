import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BookMarked,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Pencil,
} from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HARI,
  JADWAL,
  KELAS,
  MAPEL,
  NILAI,
  SISWA,
  TUGAS,
  UJIAN,
  namaKelas,
  rataRataSiswa,
} from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";
import { useDataCloud } from "@/lib/data-cloud";

export const Route = createFileRoute("/akademik")({
  head: () => ({
    meta: [
      { title: "Akademik — Jadwal, Tugas, Nilai & E-Rapor | SMS" },
      {
        name: "description",
        content:
          "Kelola kurikulum, jadwal pelajaran, tugas, ujian, input nilai, dan e-rapor siswa dalam satu modul akademik terpadu.",
      },
      { property: "og:title", content: "Modul Akademik — SMS Sekolah" },
      {
        property: "og:description",
        content: "Jadwal pelajaran, tugas, ujian, nilai, dan e-rapor per siswa.",
      },
    ],
  }),
  component: Akademik,
});

function Akademik() {
  const { sesi } = useAuth();
  useDataCloud();
  const waliMurid = sesi?.peran === "walimurid";
  const [kelasId, setKelasId] = useState("K5A");
  const jadwalKelas = JADWAL.filter((j) => j.kelasId === kelasId);
  const siswaKelas = SISWA.filter((s) => s.kelasId === kelasId && (!waliMurid || s.id === sesi.siswaId));
  const tugasKelas = TUGAS.filter((t) => !waliMurid || t.kelasId === kelasId);
  const ujianKelas = UJIAN.filter((u) => !waliMurid || u.kelasId === kelasId);
  const rataKelas = Math.round(
    siswaKelas.reduce((a, s) => a + rataRataSiswa(s.id), 0) / (siswaKelas.length || 1),
  );

  return (
    <AppShell>
      <PageHeader
        judul={waliMurid ? "Akademik Anak" : "Akademik"}
        deskripsi={waliMurid ? `Jadwal, tugas, ujian, dan nilai ${siswaKelas[0]?.nama ?? "anak Anda"}.` : "Kurikulum, jadwal pelajaran, tugas, ujian, penilaian, dan e-rapor."}
        aksi={
          waliMurid ? undefined : <Select value={kelasId} onValueChange={setKelasId}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KELAS.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  Kelas {k.nama} · {k.ruang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={waliMurid ? "Kelas anak" : "Rombel aktif"} nilai={waliMurid ? namaKelas(kelasId) : KELAS.length} keterangan={waliMurid ? "Tahun ajaran berjalan" : "Kelas 1 sampai 6"} icon={GraduationCap} />
        <StatCard label="Mata pelajaran" nilai={MAPEL.length} keterangan="Kurikulum Merdeka" icon={BookMarked} />
        <StatCard label="Tugas aktif" nilai={tugasKelas.filter((t) => t.status === "Aktif").length} keterangan="Belum lewat tenggat" icon={ClipboardList} />
        <StatCard label={waliMurid ? "Rata-rata anak" : `Rata-rata kelas ${namaKelas(kelasId)}`} nilai={rataKelas} keterangan="Skala 0–100" icon={CalendarDays} />
      </section>

      <Tabs defaultValue="jadwal" className="mt-6">
        <TabsList>
          <TabsTrigger value="jadwal">Jadwal</TabsTrigger>
          <TabsTrigger value="tugas">Tugas</TabsTrigger>
          <TabsTrigger value="ujian">Ujian</TabsTrigger>
          <TabsTrigger value="nilai">Nilai & E-Rapor</TabsTrigger>
        </TabsList>

        <TabsContent value="jadwal" className="mt-4">
          <Card className="overflow-x-auto p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Jadwal pelajaran kelas {namaKelas(kelasId)}
            </h2>
            <div className="mt-4 grid min-w-[52rem] grid-cols-5 gap-3">
              {HARI.map((hari) => (
                <div key={hari}>
                  <p className="rounded-t-md bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground">
                    {hari}
                  </p>
                  <ul className="space-y-2 rounded-b-md border border-t-0 border-border p-2">
                    {jadwalKelas
                      .filter((j) => j.hari === hari)
                      .map((j) => (
                        <li key={j.id} className="rounded-md bg-secondary/70 p-2">
                          <p className="text-xs font-semibold text-foreground">{j.mapel}</p>
                          <p className="text-[0.7rem] text-muted-foreground">
                            {j.jamMulai}–{j.jamSelesai}
                          </p>
                          <p className="text-[0.7rem] text-muted-foreground">{j.guru}</p>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tugas" className="mt-4">
          <TabelData
            judul="Daftar tugas"
            deskripsi="Progres pengumpulan tugas per kelas. Buka Nilai untuk melihat siswa yang belum mengumpulkan."
            data={tugasKelas}
            kolom={[
              { judul: "Judul", render: (t) => <span className="font-medium">{t.judul}</span> },
              { judul: "Kelas", render: (t) => namaKelas(t.kelasId) },
              { judul: "Mapel", render: (t) => t.mapel },
              { judul: "Tenggat", render: (t) => t.tenggat },
              { judul: "Pengumpulan", kanan: true, render: (t) => `${t.dikumpulkan}/${t.total}` },
              { judul: "Status", render: (t) => <StatusPill nada={nadaStatus(t.status)}>{t.status}</StatusPill> },
              ...(!waliMurid ? [{
                judul: "Aksi",
                kanan: true,
                render: (t: (typeof TUGAS)[number]) => (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/tugas/$tugasId" params={{ tugasId: t.id }}>
                      <ClipboardCheck className="size-4" /> Nilai tugas
                    </Link>
                  </Button>
                ),
              }] : []),
            ]}
          />
        </TabsContent>

        <TabsContent value="ujian" className="mt-4">
          <TabelData
            judul="Jadwal ujian & penilaian"
            deskripsi="Tekan Edit untuk membuka daftar siswa dan menginput nilai hasil ujian."
            data={ujianKelas}
            kolom={[
              { judul: "Nama", render: (u) => <span className="font-medium">{u.nama}</span> },
              { judul: "Jenis", render: (u) => <StatusPill>{u.jenis}</StatusPill> },
              { judul: "Mapel", render: (u) => u.mapel },
              { judul: "Kelas", render: (u) => namaKelas(u.kelasId) },
              { judul: "Tanggal", render: (u) => u.tanggal },
              ...(!waliMurid ? [{
                judul: "Aksi",
                kanan: true,
                render: (u: (typeof UJIAN)[number]) => (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/ujian/$ujianId" params={{ ujianId: u.id }}>
                      <Pencil className="size-4" /> Edit nilai
                    </Link>
                  </Button>
                ),
              }] : []),
            ]}
          />
        </TabsContent>

        <TabsContent value="nilai" className="mt-4">
          <TabelData
            judul={`E-Rapor kelas ${namaKelas(kelasId)}`}
            deskripsi="Nilai rata-rata per mata pelajaran inti."
            data={siswaKelas}
            kolom={[
              { judul: "NISN", render: (s) => s.nisn },
              { judul: "Nama siswa", render: (s) => <span className="font-medium">{s.nama}</span> },
              ...MAPEL.slice(0, 5).map((m) => ({
                judul: m.split(" ")[0]!,
                kanan: true,
                render: (s: (typeof SISWA)[number]) =>
                  NILAI.find((n) => n.siswaId === s.id && n.mapel === m)?.nilai ?? "-",
              })),
              {
                judul: "Rata-rata",
                kanan: true,
                render: (s) => {
                  const r = rataRataSiswa(s.id);
                  return (
                    <StatusPill nada={r >= 80 ? "baik" : r >= 70 ? "peringatan" : "bahaya"}>{r}</StatusPill>
                  );
                },
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
