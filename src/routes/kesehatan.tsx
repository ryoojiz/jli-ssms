import { createFileRoute } from "@tanstack/react-router";
import { Activity, HeartPulse, Ruler, Stethoscope } from "lucide-react";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ANTROPOMETRI, KUNJUNGAN_UKS, SCREENING } from "@/lib/demo-data";
import { SISWA } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/kesehatan")({
  head: () => ({
    meta: [
      { title: "Kesehatan UKS — Screening & Antropometri | SMS" },
      {
        name: "description",
        content:
          "Catatan kunjungan UKS, screening kesehatan berkala, pengukuran antropometri siswa, dan pengelolaan rujukan ke fasilitas kesehatan.",
      },
      { property: "og:title", content: "Modul Kesehatan (UKS) — SMS Sekolah" },
      {
        property: "og:description",
        content: "Kunjungan UKS, antropometri, screening berkala, dan rujukan.",
      },
    ],
  }),
  component: Kesehatan,
});

function Kesehatan() {
  const { sesi } = useAuth();
  const waliMurid = sesi?.peran === "walimurid";
  const anak = SISWA.find((s) => s.id === sesi?.siswaId);
  const kunjungan = waliMurid ? KUNJUNGAN_UKS.filter((k) => k.siswa === anak?.nama) : KUNJUNGAN_UKS;
  return (
    <AppShell>
      <PageHeader
        judul={waliMurid ? "Kesehatan Anak" : "Kesehatan (UKS)"}
        deskripsi={waliMurid ? `Riwayat layanan UKS ${anak?.nama ?? "anak Anda"}.` : "Kunjungan UKS, screening berkala, antropometri, dan rujukan fasilitas kesehatan."}
      />

      {!waliMurid ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kunjungan hari ini" nilai={KUNJUNGAN_UKS.filter((k) => k.tanggal === "2026-09-04").length} keterangan="Tercatat petugas UKS" icon={HeartPulse} />
        <StatCard label="Rujukan aktif" nilai={KUNJUNGAN_UKS.filter((k) => k.status === "Rujukan").length} keterangan="Puskesmas Menteng" icon={Stethoscope} />
        <StatCard label="Siswa terscreening" nilai={198} keterangan="Semester ganjil 2026/2027" icon={Activity} />
        <StatCard label="Temuan gizi" nilai={SCREENING[3]!.temuan} keterangan="Perlu tindak lanjut & edukasi" icon={Ruler} />
      </section> : null}

      {!waliMurid ? <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Hasil screening berkala</h2>
          <ul className="mt-4 space-y-4">
            {SCREENING.map((s) => {
              const persen = Math.round((s.temuan / s.diperiksa) * 100);
              return (
                <li key={s.jenis}>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="font-medium text-foreground">{s.jenis}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.temuan} temuan / {s.diperiksa} diperiksa
                    </span>
                  </div>
                  <Progress value={persen} className="mt-1.5 h-2" />
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Antropometri rata-rata per kelas</h2>
          <div className="mt-4 space-y-3">
            {ANTROPOMETRI.map((a) => (
              <div key={a.kelas} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Kelas {a.kelas}</p>
                  <p className="text-xs text-muted-foreground">
                    TB {a.rataTinggi} cm · BB {a.rataBerat} kg
                  </p>
                </div>
                <div className="text-right">
                  <StatusPill nada={nadaStatus(a.statusGizi)}>{a.statusGizi}</StatusPill>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {a.persenNormal}% gizi normal
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section> : null}

      <div className="mt-6">
        <TabelData
          judul={waliMurid ? "Riwayat kesehatan anak" : "Catatan kunjungan UKS"}
          deskripsi={waliMurid ? "Hanya catatan kesehatan anak yang terkait dengan akun Anda." : "Data kesehatan tergolong data terbatas — akses hanya untuk petugas UKS dan kepala sekolah."}
          data={kunjungan}
          kolom={[
            { judul: "ID", render: (k) => k.id },
            { judul: "Siswa", render: (k) => <span className="font-medium">{k.siswa}</span> },
            { judul: "Kelas", render: (k) => k.kelas },
            { judul: "Tanggal", render: (k) => k.tanggal },
            { judul: "Keluhan", render: (k) => k.keluhan },
            { judul: "Tindakan", render: (k) => k.tindakan },
            { judul: "Status", render: (k) => <StatusPill nada={nadaStatus(k.status)}>{k.status}</StatusPill> },
          ]}
        />
      </div>
    </AppShell>
  );
}
