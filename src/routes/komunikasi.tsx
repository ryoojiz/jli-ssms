import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Megaphone } from "lucide-react";
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
import {
  announcementVisible,
  formatDemoDateTime,
  markNotificationRead,
  publishAnnouncement,
  useDemoWorkflow,
  type AnnouncementTarget,
} from "@/lib/demo-workflow";

export const Route = createFileRoute("/komunikasi")({
  head: () => ({
    meta: [
      { title: "Komunikasi — Pengumuman & Notifikasi Wali | SMS" },
      {
        name: "description",
        content:
          "Pengumuman sekolah dan pembaruan kehadiran dalam aplikasi untuk wali murid. Pengiriman eksternal belum terhubung.",
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
  const workflow = useDemoWorkflow();
  const waliMurid = sesi?.peran === "walimurid";
  const canPublish = sesi?.peran === "operator";
  const [judul, setJudul] = useState("");
  const [target, setTarget] = useState<AnnouncementTarget>("Semua");
  const [isi, setIsi] = useState("");
  const demoAnnouncements = workflow.announcements.map((item) => ({
    id: item.id,
    judul: item.title,
    isi: item.body,
    target: item.target,
    tanggal: formatDemoDateTime(item.publishedAt),
    pengirim: item.author,
  }));
  const daftar = [...demoAnnouncements, ...PENGUMUMAN];
  const pengumumanTerlihat = sesi
    ? daftar.filter((item) => announcementVisible(item.target as AnnouncementTarget, sesi))
    : [];
  const pemberitahuan = workflow.notifications.filter(
    (item) => waliMurid && item.siswaId === sesi?.siswaId,
  );
  const belumDibaca = pemberitahuan.filter((item) => !workflow.readIds.includes(item.id)).length;

  function kirim() {
    if (!sesi) return;
    try {
      publishAnnouncement(sesi, judul, isi, target);
      setJudul("");
      setIsi("");
      toast.success("Pengumuman tersimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pengumuman gagal disimpan.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        judul={waliMurid ? "Informasi Sekolah" : "Komunikasi"}
        deskripsi={
          waliMurid
            ? "Pengumuman dan pembaruan kehadiran untuk anak Anda."
            : "Pengumuman sekolah dan pembaruan untuk wali murid. WhatsApp, email, dan push belum tersedia."
        }
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Pengumuman terlihat"
          nilai={pengumumanTerlihat.length}
          keterangan="Sesuai target penerima"
          icon={Megaphone}
        />
        <StatCard
          label={waliMurid ? "Pembaruan belum dibaca" : "Pembaruan kehadiran"}
          nilai={waliMurid ? belumDibaca : workflow.notifications.length}
          keterangan="Notifikasi dalam aplikasi"
          icon={BellRing}
        />
      </section>

      {waliMurid ? (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold">Pembaruan untuk anak Anda</h2>
          {pemberitahuan.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Belum ada pembaruan. Keputusan izin atau koreksi kehadiran akan muncul di sini.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pemberitahuan.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDemoDateTime(item.createdAt)}
                    </p>
                  </div>
                  {!workflow.readIds.includes(item.id) && sesi ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markNotificationRead(sesi, item.id)}
                    >
                      Tandai dibaca
                    </Button>
                  ) : (
                    <StatusPill>Dibaca</StatusPill>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {canPublish ? (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Buat pengumuman</h2>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="judul">Judul</Label>
                <Input
                  id="judul"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Mis. Libur Maulid Nabi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="target">Target penerima</Label>
                <Select
                  value={target}
                  onValueChange={(value) => setTarget(value as AnnouncementTarget)}
                >
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
                Simpan pengumuman
              </Button>
            </div>
          </Card>
        ) : null}

        <Card className={canPublish ? "p-5 lg:col-span-2" : "p-5 lg:col-span-3"}>
          <h2 className="text-sm font-semibold text-foreground">Pengumuman untuk Anda</h2>
          <ul className="mt-4 space-y-3">
            {pengumumanTerlihat.map((p) => (
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
          {pengumumanTerlihat.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Belum ada pengumuman untuk peran ini.
            </p>
          ) : null}
        </Card>
      </section>

      {!waliMurid ? (
        <div className="mt-6">
          <TabelData
            judul="Pratinjau kanal notifikasi eksternal"
            deskripsi="Pengiriman WhatsApp, email, dan push belum tersedia."
            data={NOTIFIKASI}
            kolom={[
              { judul: "ID", render: (n) => n.id },
              { judul: "Kanal", render: (n) => <StatusPill>{n.kanal}</StatusPill> },
              {
                judul: "Penerima",
                render: (n) => <span className="font-medium">{n.penerima}</span>,
              },
              { judul: "Isi", render: (n) => n.isi },
              { judul: "Waktu", render: (n) => n.waktu },
              {
                judul: "Status",
                render: (n) => <StatusPill nada={nadaStatus(n.status)}>{n.status}</StatusPill>,
              },
            ]}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
