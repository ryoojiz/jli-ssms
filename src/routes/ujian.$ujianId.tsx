import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, Save, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell, PageHeader, StatusPill } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SISWA, namaKelas } from "@/lib/demo-data";
import { nilaiUjianAwal, ujianById } from "@/lib/guru-data";

export const Route = createFileRoute("/ujian/$ujianId")({
  head: () => ({
    meta: [
      { title: "Input Nilai Ujian — Daftar Siswa | SMS" },
      {
        name: "description",
        content:
          "Halaman input nilai hasil ujian per siswa lengkap dengan rata-rata kelas, nilai tertinggi, dan jumlah siswa yang sudah dinilai.",
      },
      { property: "og:title", content: "Input Nilai Ujian — SMS Sekolah" },
      {
        property: "og:description",
        content: "Input dan perbarui nilai hasil ujian untuk setiap siswa.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: InputNilaiUjian,
});

function InputNilaiUjian() {
  const { ujianId } = Route.useParams();
  const ujian = ujianById(ujianId);
  const siswa = useMemo(
    () => (ujian ? SISWA.filter((s) => s.kelasId === ujian.kelasId) : []),
    [ujian],
  );
  const [nilai, setNilai] = useState<Record<string, string>>(() => nilaiUjianAwal(ujianId));
  const [pesan, setPesan] = useState<string | null>(null);

  if (!ujian) {
    return (
      <AppShell>
        <PageHeader judul="Ujian tidak ditemukan" deskripsi="Ujian yang Anda buka tidak tersedia." />
        <Button asChild variant="outline">
          <Link to="/akademik">
            <ArrowLeft className="size-4" /> Kembali ke Akademik
          </Link>
        </Button>
      </AppShell>
    );
  }

  const angka = siswa
    .map((s) => Number(nilai[s.id]))
    .filter((n) => Number.isFinite(n) && n > 0);
  const rata = angka.length ? Math.round(angka.reduce((a, b) => a + b, 0) / angka.length) : 0;
  const tertinggi = angka.length ? Math.max(...angka) : 0;

  return (
    <AppShell>
      <PageHeader
        judul={`Input nilai: ${ujian.nama}`}
        deskripsi={`${ujian.mapel} · Kelas ${namaKelas(ujian.kelasId)} · ${ujian.jenis} · ${ujian.tanggal}`}
        aksi={
          <>
            <Button asChild variant="outline">
              <Link to="/akademik">
                <ArrowLeft className="size-4" /> Kembali
              </Link>
            </Button>
            <Button onClick={() => setPesan(`Nilai ujian tersimpan untuk ${angka.length} siswa.`)}>
              <Save className="size-4" /> Simpan nilai
            </Button>
          </>
        }
      />

      {pesan ? (
        <p role="status" className="mb-4 rounded-md bg-success/12 px-3 py-2 text-sm text-success">
          {pesan}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Peserta" nilai={siswa.length} keterangan={`Kelas ${namaKelas(ujian.kelasId)}`} icon={Users} />
        <StatCard label="Sudah dinilai" nilai={angka.length} keterangan="Nilai terisi" icon={ClipboardCheck} />
        <StatCard label="Rata-rata" nilai={rata} keterangan="Skala 0–100" icon={ClipboardCheck} />
        <StatCard label="Nilai tertinggi" nilai={tertinggi} keterangan="Kelas ini" icon={ClipboardCheck} />
      </section>

      <div className="mt-6">
        <TabelData
          judul="Daftar siswa & nilai ujian"
          deskripsi="Isi nilai 0–100 untuk setiap siswa, lalu tekan Simpan nilai."
          data={siswa}
          kolom={[
            { judul: "NISN", render: (s) => s.nisn },
            { judul: "Nama siswa", render: (s) => <span className="font-medium">{s.nama}</span> },
            { judul: "L/P", render: (s) => s.jenisKelamin },
            {
              judul: "Predikat",
              render: (s) => {
                const n = Number(nilai[s.id]);
                if (!Number.isFinite(n) || !n) return <StatusPill>Belum dinilai</StatusPill>;
                return (
                  <StatusPill nada={n >= 80 ? "baik" : n >= 70 ? "peringatan" : "bahaya"}>
                    {n >= 80 ? "Baik" : n >= 70 ? "Cukup" : "Perlu bimbingan"}
                  </StatusPill>
                );
              },
            },
            {
              judul: "Nilai",
              kanan: true,
              render: (s) => (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  aria-label={`Nilai ujian ${s.nama}`}
                  value={nilai[s.id] ?? ""}
                  onChange={(e) => setNilai((n) => ({ ...n, [s.id]: e.target.value }))}
                  className="ml-auto w-20 text-right"
                />
              ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
