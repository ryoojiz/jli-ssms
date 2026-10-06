import { createFileRoute } from "@tanstack/react-router";
import { BellRing, MessageSquare, Megaphone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { NOTIFIKASI, PENGUMUMAN } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/komunikasi")({
  head: () => ({
    meta: [
      { title: "Komunikasi — Pengumuman & Notifikasi Wali | SMS" },
      {
        name: "description",
        content:
          "Pengumuman sekolah, pesan ke kelas dan wali murid, serta riwayat pengiriman notifikasi push, email, dan WhatsApp Gateway.",
      },
      { property: "og:title", content: "Modul Komunikasi — SMS Sekolah" },
      {
        property: "og:description",
        content: "Pengumuman, pesan wali murid, dan status pengiriman notifikasi.",
      },
    ],
  }),
  component: Komunikasi,
});

function Komunikasi() {
  const { sesi } = useAuth();
  const waliMurid = sesi?.peran === "walimurid";
  const [judul, setJudul] = useState("");
  const [target, setTarget] = useState("Semua");
  const [isi, setIsi] = useState("");
  const [daftar, setDaftar] = useState(PENGUMUMAN);

  function kirim() {
    if (!judul.trim() || !isi.trim()) {
      toast.error("Judul dan isi pengumuman wajib diisi.");
      return;
    }
    setDaftar((d) => [
      {
        id: `PG-${78 + d.length}`,
        judul,
        isi,
        target,
        tanggal: "2026-09-04",
        pengirim: "Operator Sekolah",
      },
      ...d,
    ]);
    setJudul("");
    setIsi("");
    toast.success("Pengumuman diterbitkan dan notifikasi diantrekan.");
  }

  return (
    <AppShell>
      <PageHeader
        judul={waliMurid ? "Informasi Sekolah" : "Komunikasi"}
        deskripsi={waliMurid ? "Pengumuman yang ditujukan untuk orang tua dan kelas anak Anda." : "Pengumuman sekolah, pesan ke wali murid, dan pemantauan pengiriman notifikasi."}
      />

      {!waliMurid ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pengumuman aktif" nilai={daftar.length} keterangan="Tayang di aplikasi wali" icon={Megaphone} />
        <StatCard label="Notifikasi hari ini" nilai={NOTIFIKASI.length} keterangan="Push, email, WhatsApp" icon={BellRing} />
        <StatCard label="Terkirim" nilai={NOTIFIKASI.filter((n) => n.status === "Terkirim").length} keterangan="Delivery status tercatat" icon={Send} />
        <StatCard label="Gagal kirim" nilai={NOTIFIKASI.filter((n) => n.status === "Gagal").length} keterangan="Nomor perlu diverifikasi" icon={MessageSquare} />
      </section> : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {!waliMurid ? <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Buat pengumuman</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="judul">Judul</Label>
              <Input
                id="judul"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Libur Maulid Nabi"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target">Target penerima</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger id="target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Semua", "Orang Tua", "Guru", "Kelas 1-3", "Kelas 4-6"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="isi">Isi pengumuman</Label>
              <Textarea
                id="isi"
                rows={5}
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                placeholder="Tuliskan informasi lengkap…"
              />
            </div>
            <Button className="w-full" onClick={kirim}>
              Terbitkan pengumuman
            </Button>
          </div>
        </Card> : null}

        <Card className={waliMurid ? "p-5 lg:col-span-3" : "p-5 lg:col-span-2"}>
          <h2 className="text-sm font-semibold text-foreground">Pengumuman terbit</h2>
          <ul className="mt-4 space-y-3">
            {daftar.filter((p) => !waliMurid || ["Semua", "Orang Tua", "Kelas 4-6"].includes(p.target)).map((p) => (
              <li key={p.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{p.judul}</p>
                  <StatusPill nada="info">{p.target}</StatusPill>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.isi}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {p.pengirim} · {p.tanggal}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {!waliMurid ? <div className="mt-6">
        <TabelData
          judul="Riwayat notifikasi"
          deskripsi="Status pengiriman per kanal beserta penerima."
          data={NOTIFIKASI}
          kolom={[
            { judul: "ID", render: (n) => n.id },
            { judul: "Kanal", render: (n) => <StatusPill>{n.kanal}</StatusPill> },
            { judul: "Penerima", render: (n) => <span className="font-medium">{n.penerima}</span> },
            { judul: "Isi", render: (n) => n.isi },
            { judul: "Waktu", render: (n) => n.waktu },
            { judul: "Status", render: (n) => <StatusPill nada={nadaStatus(n.status)}>{n.status}</StatusPill> },
          ]}
        />
      </div> : null}
    </AppShell>
  );
}
