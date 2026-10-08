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
import { useAuth } from "@/lib/auth-context";

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
  const { sesi } = useAuth();
  const { ujianId } = Route.useParams();
  const ujian = ujianById(ujianId);
  const siswa = useMemo(
    () => (ujian ? SISWA.filter((s) => s.kelasId === ujian.kelasId) : []),
    [ujian],
  );
  const [nilai, setNilai] = useState<Record<string, string>>(() => nilaiUjianAwal(ujianId));

  if (
    !sesi ||
    !["guru", "wali_kelas", "operator", "kepala_sekolah", "auditor"].includes(sesi.peran)
  ) {
    return (
      <AppShell>
        <PageHeader
          judul="Akses terbatas"
          deskripsi="Rincian nilai ujian contoh hanya untuk staf sekolah yang berwenang."
        />
      </AppShell>
    );
  }

  if (!ujian) {
    return (
      <AppShell>
        <PageHeader
          judul="Ujian tidak ditemukan"
          deskripsi="Ujian yang Anda buka tidak tersedia."
        />
        <Button asChild variant="outline">
          <Link to="/akademik">
            <ArrowLeft className="size-4" /> Kembali ke Akademik
          </Link>
        </Button>
      </AppShell>
    );
  }

  const angka = siswa.map((s) => Number(nilai[s.id])).filter((n) => Number.isFinite(n) && n > 0);
  const rata = angka.length ? Math.round(angka.reduce((a, b) => a + b, 0) / angka.length) : 0;
  const tertinggi = angka.length ? Math.max(...angka) : 0;

  return (
    <AppShell>
      <PageHeader
        judul={`Input nilai: ${ujian.nama}`}
        deskripsi={`${ujian.mapel} · Kelas ${namaKelas(ujian.kelasId)} · ${ujian.jenis} · ${ujian.tanggal} · data contoh statis; input nilai baru ada di tab Nilai demo pada Akademik.`}
        aksi={
          <>
            <Button asChild variant="outline">
              <Link to="/akademik">
                <ArrowLeft className="size-4" /> Kembali
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Peserta"
          nilai={siswa.length}
          keterangan={`Kelas ${namaKelas(ujian.kelasId)}`}
          icon={Users}
        />
        <StatCard
          label="Sudah dinilai"
          nilai={angka.length}
          keterangan="Nilai terisi"
          icon={ClipboardCheck}
        />
        <StatCard label="Rata-rata" nilai={rata} keterangan="Skala 0–100" icon={ClipboardCheck} />
        <StatCard
          label="Nilai tertinggi"
          nilai={tertinggi}
          keterangan="Kelas ini"
          icon={ClipboardCheck}
        />
      </section>

      <div className="mt-6">
        <TabelData
          judul="Daftar siswa & nilai ujian"
          deskripsi="Nilai di halaman ini adalah contoh statis, bukan entri yang tersimpan. Buat penilaian pada tab Nilai demo."
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
                  readOnly
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
