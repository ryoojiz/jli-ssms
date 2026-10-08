import { createFileRoute } from "@tanstack/react-router";
import { FileVideo, Laptop, ListChecks, Sparkles, Upload } from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { KELAS, KUIS, MAPEL, MATERI, PERANGKAT, namaKelas } from "@/lib/demo-data";

const TIPE_MATERI = ["Video", "PDF", "Slide", "Audio", "Tautan"] as const;

export const Route = createFileRoute("/kelas-digital")({
  head: () => ({
    meta: [
      { title: "Smart Classroom — Materi Digital & Kuis | SMS" },
      {
        name: "description",
        content:
          "Distribusi materi digital, kuis interaktif dengan penilaian otomatis, dan pemantauan perangkat pembelajaran di setiap ruang kelas.",
      },
      { property: "og:title", content: "Smart Classroom — SMS Sekolah" },
      {
        property: "og:description",
        content: "Materi digital, kuis interaktif, dan monitoring perangkat kelas.",
      },
    ],
  }),
  component: KelasDigital,
});

type MateriItem = (typeof MATERI)[number];

function KelasDigital() {
  const perangkatKelas = PERANGKAT.filter((p) => ["Display", "Sensor", "RFID"].includes(p.tipe));
  const { bolehUbah } = useAuth();
  const bolehUnggah = bolehUbah("kelas-digital");

  const [materi, setMateri] = useState<MateriItem[]>([...MATERI]);
  const [formTampil, setFormTampil] = useState(false);
  const [judul, setJudul] = useState("");
  const [mapel, setMapel] = useState(MAPEL[0]!);
  const [kelasId, setKelasId] = useState(KELAS[5]!.id);
  const [tipe, setTipe] = useState<string>("PDF");
  const [namaBerkas, setNamaBerkas] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  function unggah(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim()) return;
    setMateri((m) => [
      { id: `MD-${30 + m.length}`, judul: judul.trim(), mapel, kelasId, tipe, diakses: 0 },
      ...m,
    ]);
    setPesan(
      `Materi "${judul.trim()}" berhasil diunggah untuk kelas ${namaKelas(kelasId)}${namaBerkas ? ` (berkas: ${namaBerkas})` : ""}.`,
    );
    setJudul("");
    setNamaBerkas(null);
    setFormTampil(false);
  }

  return (
    <AppShell>
      <PageHeader
        judul="Smart Classroom"
        deskripsi="Materi digital, kuis interaktif, dan monitoring perangkat ruang kelas."
        aksi={
          bolehUnggah ? (
            <Button onClick={() => setFormTampil((v) => !v)}>
              <Upload className="size-4" /> Unggah materi
            </Button>
          ) : undefined
        }
      />

      {pesan ? (
        <p role="status" className="mb-4 rounded-md bg-success/12 px-3 py-2 text-sm text-success">
          {pesan}
        </p>
      ) : null}

      {bolehUnggah && formTampil ? (
        <Card className="mb-6 p-5">
          <h2 className="text-sm font-semibold text-foreground">Unggah materi pelajaran digital</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Materi akan tampil pada daftar materi kelas yang dipilih.
          </p>
          <form onSubmit={unggah} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="judul-materi">Judul materi</Label>
              <Input
                id="judul-materi"
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Mis. Modul PDF Bangun Ruang"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mata pelajaran</Label>
              <Select value={mapel} onValueChange={setMapel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAPEL.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kelas</Label>
              <Select value={kelasId} onValueChange={setKelasId}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-1.5">
              <Label>Jenis materi</Label>
              <Select value={tipe} onValueChange={setTipe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPE_MATERI.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="berkas-materi">Berkas materi</Label>
              <Input
                id="berkas-materi"
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.mp3,.png,.jpg"
                onChange={(e) => setNamaBerkas(e.target.files?.[0]?.name ?? null)}
              />
              {namaBerkas ? (
                <p className="text-xs text-muted-foreground">Dipilih: {namaBerkas}</p>
              ) : null}
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit">
                <Upload className="size-4" /> Simpan & unggah
              </Button>
              <Button type="button" variant="outline" onClick={() => setFormTampil(false)}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Materi digital" nilai={materi.length} keterangan="Video, PDF, slide, audio" icon={FileVideo} />
        <StatCard label="Total akses materi" nilai={materi.reduce((a, b) => a + b.diakses, 0)} keterangan="Minggu berjalan" icon={Sparkles} />
        <StatCard label="Kuis dibuat" nilai={KUIS.length} keterangan="Penilaian otomatis" icon={ListChecks} />
        <StatCard label="Perangkat kelas" nilai={perangkatKelas.length} keterangan={`${perangkatKelas.filter((p) => p.status === "Online").length} online`} icon={Laptop} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Materi digital terbaru</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {materi.map((m) => (
              <div key={m.id} className="rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{m.judul}</p>
                  <StatusPill nada="info">{m.tipe}</StatusPill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.mapel} · Kelas {namaKelas(m.kelasId)}
                </p>
                <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                  {m.diakses} kali diakses siswa
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Monitoring perangkat kelas</h2>
          <ul className="mt-4 space-y-3">
            {perangkatKelas.map((p) => (
              <li key={p.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{p.nama}</p>
                  <StatusPill nada={nadaStatus(p.status)}>{p.status}</StatusPill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.lokasi} · {p.terakhir}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <div className="mt-6">
        <TabelData
          judul="Kuis interaktif"
          deskripsi="Nilai kuis otomatis tersinkronisasi ke modul Akademik."
          data={KUIS}
          kolom={[
            { judul: "ID", render: (k) => k.id },
            { judul: "Judul", render: (k) => <span className="font-medium">{k.judul}</span> },
            { judul: "Kelas", render: (k) => namaKelas(k.kelasId) },
            { judul: "Soal", kanan: true, render: (k) => k.soal },
            { judul: "Peserta", kanan: true, render: (k) => k.peserta },
            { judul: "Rata-rata", kanan: true, render: (k) => (k.rataRata ? k.rataRata : "-") },
            { judul: "Status", render: (k) => <StatusPill nada={nadaStatus(k.status)}>{k.status}</StatusPill> },
          ]}
        />
      </div>
    </AppShell>
  );
}
