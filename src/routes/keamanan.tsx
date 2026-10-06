import { createFileRoute } from "@tanstack/react-router";
import { Bell, Cctv, DoorOpen, Maximize2, ShieldAlert, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

import cctvGerbang from "@/assets/cctv-gerbang.jpg";
import cctvKantin from "@/assets/cctv-kantin.jpg";
import cctvKoridor from "@/assets/cctv-koridor.jpg";
import cctvSmartGate from "@/assets/cctv-smart-gate.jpg";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INSIDEN, PERANGKAT, TAMU } from "@/lib/demo-data";

export const Route = createFileRoute("/keamanan")({
  head: () => ({
    meta: [
      { title: "Smart Security — CCTV AI, Smart Gate & Insiden | SMS" },
      {
        name: "description",
        content:
          "Pemantauan keamanan sekolah: CCTV berbasis AI, smart gate, buku tamu digital, panic button, dan penanganan insiden secara terpusat.",
      },
      { property: "og:title", content: "Smart Security — SMS Sekolah" },
      {
        property: "og:description",
        content: "CCTV AI, smart gate, visitor log, panic button, dan log insiden.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Keamanan,
});

const GAMBAR_CCTV: Record<string, string> = {
  "DV-01": cctvGerbang,
  "DV-02": cctvKoridor,
  "DV-03": cctvSmartGate,
  "DV-05": cctvKantin,
};

function WaktuCctv() {
  const [waktu, setWaktu] = useState<Date | null>(null);

  useEffect(() => {
    const perbarui = () => setWaktu(new Date());
    perbarui();
    const interval = window.setInterval(perbarui, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="tabular-nums">
      {waktu
        ? new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(waktu)
        : "--/--/---- --.--.--"}
    </span>
  );
}

function Keamanan() {
  const cctv = PERANGKAT.filter((p) => p.tipe === "CCTV");

  return (
    <AppShell>
      <PageHeader
        judul="Smart Security"
        deskripsi="CCTV AI, smart gate, buku tamu digital, panic button, dan manajemen insiden."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Insiden terbuka" nilai={INSIDEN.filter((i) => i.status !== "Selesai").length} keterangan="Perlu tindak lanjut" icon={ShieldAlert} />
        <StatCard label="Tamu di dalam" nilai={TAMU.filter((t) => t.status === "Di dalam").length} keterangan="Belum melakukan check-out" icon={DoorOpen} />
        <StatCard label="Kamera aktif" nilai={`${cctv.filter((c) => c.status === "Online").length}/${cctv.length}`} keterangan="Analitik AI menyala" icon={Cctv} />
        <StatCard label="Panic button" nilai="Siap" keterangan="1 unit terpasang di kantin" icon={Bell} />
      </section>

      <section className="mt-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Monitoring perangkat keamanan</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PERANGKAT.filter((p) => ["CCTV", "Gate", "Panic"].includes(p.tipe)).map((p) => (
              <div key={p.id} className="rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{p.nama}</p>
                  <StatusPill nada={nadaStatus(p.status)}>{p.status}</StatusPill>
                </div>
                <div className="group relative mt-3 aspect-video overflow-hidden rounded-md bg-foreground">
                  <img
                    src={GAMBAR_CCTV[p.id]}
                    alt={`Tayangan langsung ${p.nama} di ${p.lokasi}`}
                    className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-100 motion-reduce:transition-none"
                    loading="lazy"
                    width={1024}
                    height={576}
                  />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-foreground/75 to-transparent p-2.5 text-[0.68rem] font-medium text-background">
                    <span className="inline-flex items-center gap-1.5 rounded-sm bg-destructive px-2 py-1 font-semibold text-destructive-foreground shadow-sm">
                      <span className="size-1.5 animate-pulse rounded-full bg-destructive-foreground motion-reduce:animate-none" />
                      LIVE
                    </span>
                    <span className="rounded-sm bg-foreground/65 px-2 py-1">{p.id} · 1080p</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-foreground/85 to-transparent p-2.5 pt-8 text-[0.68rem] text-background">
                    <div>
                      <p className="font-semibold">{p.lokasi}</p>
                      <WaktuCctv /> WIB
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className="size-3.5" aria-label="Koneksi stabil" />
                      <Maximize2 className="size-3.5" aria-hidden />
                    </div>
                  </div>
                </div>
                <p className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Telemetri terakhir: {p.terakhir}</span>
                  <span className="font-medium text-success">Koneksi stabil</span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Tabs defaultValue="insiden" className="mt-6">
        <TabsList>
          <TabsTrigger value="insiden">Log insiden</TabsTrigger>
          <TabsTrigger value="tamu">Buku tamu</TabsTrigger>
        </TabsList>

        <TabsContent value="insiden" className="mt-4">
          <TabelData
            judul="Log insiden keamanan"
            deskripsi="Event dari CCTV AI, smart gate, dan panic button diteruskan ke Command Center."
            data={INSIDEN}
            kolom={[
              { judul: "ID", render: (i) => i.id },
              { judul: "Waktu", render: (i) => i.waktu },
              { judul: "Jenis", render: (i) => <span className="font-medium">{i.jenis}</span> },
              { judul: "Lokasi", render: (i) => i.lokasi },
              { judul: "Sumber", render: (i) => <StatusPill>{i.sumber}</StatusPill> },
              { judul: "Tingkat", render: (i) => <StatusPill nada={nadaStatus(i.tingkat)}>{i.tingkat}</StatusPill> },
              { judul: "Status", render: (i) => <StatusPill nada={nadaStatus(i.status)}>{i.status}</StatusPill> },
            ]}
          />
        </TabsContent>

        <TabsContent value="tamu" className="mt-4">
          <TabelData
            judul="Buku tamu digital"
            deskripsi="Check-in melalui smart gate dengan verifikasi identitas."
            data={TAMU}
            kolom={[
              { judul: "ID", render: (t) => t.id },
              { judul: "Nama", render: (t) => <span className="font-medium">{t.nama}</span> },
              { judul: "Instansi", render: (t) => t.instansi },
              { judul: "Keperluan", render: (t) => t.keperluan },
              { judul: "Masuk", render: (t) => t.masuk },
              { judul: "Keluar", render: (t) => t.keluar },
              { judul: "Status", render: (t) => <StatusPill nada={nadaStatus(t.status)}>{t.status}</StatusPill> },
            ]}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
