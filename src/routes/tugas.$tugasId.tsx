import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ClipboardList, Save, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell, PageHeader, StatusPill } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { namaKelas } from "@/lib/demo-data";
import { pengumpulanTugas, tautanWhatsApp, tugasById } from "@/lib/guru-data";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/tugas/$tugasId")({
  head: () => ({
    meta: [
      { title: "Penilaian Tugas — Progres & Nilai Siswa | SMS" },
      {
        name: "description",
        content:
          "Pantau siswa yang belum mengumpulkan tugas dan berikan nilai untuk setiap pengumpulan langsung dari satu halaman.",
      },
      { property: "og:title", content: "Penilaian Tugas — SMS Sekolah" },
      {
        property: "og:description",
        content: "Daftar pengumpulan tugas per siswa beserta input penilaian.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PenilaianTugas,
});

function PenilaianTugas() {
  const { sesi } = useAuth();
  const { tugasId } = Route.useParams();
  const tugas = tugasById(tugasId);
  const baris = useMemo(() => pengumpulanTugas(tugasId), [tugasId]);
  const [nilai, setNilai] = useState<Record<string, string>>(() =>
    Object.fromEntries(baris.map((b) => [b.siswa.id, b.nilaiAwal ? String(b.nilaiAwal) : ""])),
  );

  if (
    !sesi ||
    !["guru", "wali_kelas", "operator", "kepala_sekolah", "auditor"].includes(sesi.peran)
  ) {
    return (
      <AppShell>
        <PageHeader
          judul="Akses terbatas"
          deskripsi="Rincian nilai tugas contoh hanya untuk staf sekolah yang berwenang."
        />
      </AppShell>
    );
  }

  if (!tugas) {
    return (
      <AppShell>
        <PageHeader
          judul="Tugas tidak ditemukan"
          deskripsi="Tugas yang Anda buka tidak tersedia."
        />
        <Button asChild variant="outline">
          <Link to="/akademik">
            <ArrowLeft className="size-4" /> Kembali ke Akademik
          </Link>
        </Button>
      </AppShell>
    );
  }

  const belum = baris.filter((b) => !b.sudah);
  const dinilai = baris.filter((b) => nilai[b.siswa.id]?.trim());

  return (
    <AppShell>
      <PageHeader
        judul={tugas.judul}
        deskripsi={`${tugas.mapel} · Kelas ${namaKelas(tugas.kelasId)} · Tenggat ${tugas.tenggat} · data contoh statis; input nilai baru ada di tab Nilai demo pada Akademik.`}
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
          label="Total siswa"
          nilai={baris.length}
          keterangan={`Kelas ${namaKelas(tugas.kelasId)}`}
          icon={ClipboardList}
        />
        <StatCard
          label="Sudah mengumpulkan"
          nilai={baris.length - belum.length}
          keterangan="Termasuk terlambat"
          icon={CheckCircle2}
        />
        <StatCard
          label="Belum mengumpulkan"
          nilai={belum.length}
          keterangan="Perlu ditindaklanjuti"
          icon={XCircle}
        />
        <StatCard
          label="Sudah dinilai"
          nilai={dinilai.length}
          keterangan="Skala 0–100"
          icon={Save}
        />
      </section>

      <div className="mt-6">
        <TabelData
          judul="Pengumpulan & penilaian"
          deskripsi="Nilai dan status di halaman ini adalah contoh statis, bukan entri yang tersimpan. Buat penilaian pada tab Nilai demo."
          data={baris}
          kolom={[
            {
              judul: "Nama siswa",
              render: (b) => <span className="font-medium">{b.siswa.nama}</span>,
            },
            { judul: "NISN", render: (b) => b.siswa.nisn },
            {
              judul: "Status",
              render: (b) => (
                <StatusPill nada={b.sudah ? (b.terlambat ? "peringatan" : "baik") : "bahaya"}>
                  {b.sudah ? (b.terlambat ? "Terlambat" : "Dikumpulkan") : "Belum mengumpulkan"}
                </StatusPill>
              ),
            },
            { judul: "Waktu kumpul", render: (b) => b.waktu ?? "-" },
            {
              judul: "Nilai",
              kanan: true,
              render: (b) => (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  disabled={!b.sudah}
                  readOnly
                  aria-label={`Nilai ${b.siswa.nama}`}
                  value={nilai[b.siswa.id] ?? ""}
                  onChange={(e) => setNilai((n) => ({ ...n, [b.siswa.id]: e.target.value }))}
                  className="ml-auto w-20 text-right"
                />
              ),
            },
            {
              judul: "Tindakan",
              kanan: true,
              render: (b) =>
                b.sudah ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={tautanWhatsApp(
                        b.siswa.telpWali,
                        `Bapak/Ibu ${b.siswa.namaWali}, ananda ${b.siswa.nama} belum mengumpulkan tugas "${tugas.judul}" (${tugas.mapel}). Mohon pendampingannya.`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ingatkan wali
                    </a>
                  </Button>
                ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
