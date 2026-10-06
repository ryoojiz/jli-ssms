import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Crosshair, ExternalLink, LocateFixed, MapPin, Navigation, School } from "lucide-react";

import { AppShell, PageHeader, StatusPill } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEKOLAH_LOKASI } from "@/lib/demo-data";

export const Route = createFileRoute("/lokasi")({
  head: () => ({
    meta: [
      { title: "Lokasi Sekolah & GPS | SMS" },
      {
        name: "description",
        content: "Lihat lokasi sekolah, posisi GPS pengguna, jarak, dan petunjuk arah menuju sekolah.",
      },
      { property: "og:title", content: "Lokasi Sekolah & GPS | SMS" },
      {
        property: "og:description",
        content: "Peta lokasi dan petunjuk arah menuju SDN Kebagusan 01 Pagi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LokasiSekolah,
});

type Posisi = {
  latitude: number;
  longitude: number;
  akurasi: number;
};

type SekolahLokasi = (typeof SEKOLAH_LOKASI)[number];

function jarakKm(asal: Posisi, tujuan: SekolahLokasi["koordinat"]) {
  const radiusBumi = 6371;
  const keRadian = (nilai: number) => (nilai * Math.PI) / 180;
  const bedaLintang = keRadian(tujuan.latitude - asal.latitude);
  const bedaBujur = keRadian(tujuan.longitude - asal.longitude);
  const a =
    Math.sin(bedaLintang / 2) ** 2 +
    Math.cos(keRadian(asal.latitude)) *
      Math.cos(keRadian(tujuan.latitude)) *
      Math.sin(bedaBujur / 2) ** 2;
  return radiusBumi * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function LokasiSekolah() {
  const [sekolahId, setSekolahId] = useState("");
  const [posisi, setPosisi] = useState<Posisi | null>(null);
  const [status, setStatus] = useState<"awal" | "memuat" | "gagal">("awal");
  const sekolah = SEKOLAH_LOKASI.find((item) => item.id === sekolahId);
  const jarak = useMemo(
    () => (posisi && sekolah ? jarakKm(posisi, sekolah.koordinat) : null),
    [posisi, sekolah],
  );
  const querySekolah = sekolah
    ? encodeURIComponent(`${sekolah.koordinat.latitude},${sekolah.koordinat.longitude}`)
    : "";
  const mapUrl = `https://maps.google.com/maps?q=${querySekolah}&z=16&output=embed`;

  function temukanPosisi() {
    if (!("geolocation" in navigator)) {
      setStatus("gagal");
      return;
    }
    setStatus("memuat");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosisi({
          latitude: coords.latitude,
          longitude: coords.longitude,
          akurasi: coords.accuracy,
        });
        setStatus("awal");
      },
      () => setStatus("gagal"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  const arahUrl = sekolah
    ? posisi
      ? `https://www.google.com/maps/dir/?api=1&origin=${posisi.latitude},${posisi.longitude}&destination=${sekolah.koordinat.latitude},${sekolah.koordinat.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${sekolah.koordinat.latitude},${sekolah.koordinat.longitude}`
    : "";

  return (
    <AppShell>
      <PageHeader
        judul="Lokasi Sekolah"
        deskripsi="Pilih sekolah terlebih dahulu untuk melihat peta, jarak, dan petunjuk arah."
        aksi={
          <Button onClick={temukanPosisi} disabled={!sekolah || status === "memuat"}>
            <LocateFixed aria-hidden />
            {status === "memuat" ? "Mencari lokasi…" : "Gunakan GPS saya"}
          </Button>
        }
      />

      <section className="mb-6 border-b border-border pb-6">
        <label htmlFor="pilih-sekolah" className="mb-2 block text-sm font-semibold text-foreground">
          Pilih sekolah tujuan
        </label>
        <Select
          value={sekolahId}
          onValueChange={(value) => {
            setSekolahId(value);
            setPosisi(null);
            setStatus("awal");
          }}
        >
          <SelectTrigger id="pilih-sekolah" className="h-11 w-full max-w-xl bg-card">
            <SelectValue placeholder="Pilih nama sekolah…" />
          </SelectTrigger>
          <SelectContent>
            {SEKOLAH_LOKASI.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.nama} · NPSN {item.npsn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {sekolah ? (
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-h-[28rem] overflow-hidden rounded-md border border-border bg-muted">
          <iframe
            key={sekolah.id}
            title={`Peta ${sekolah.nama}`}
            src={mapUrl}
            className="h-full min-h-[28rem] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                <School className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground">{sekolah.nama}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{sekolah.alamat}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">NPSN</dt>
                <dd className="font-medium text-foreground">{sekolah.npsn}</dd>
              </div>
              {"kepalaSekolah" in sekolah ? (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Kepala sekolah</dt>
                  <dd className="text-right font-medium text-foreground">{sekolah.kepalaSekolah}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Koordinat</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {sekolah.koordinat.latitude}, {sekolah.koordinat.longitude}
                </dd>
              </div>
            </dl>
            <Button asChild className="mt-5 w-full">
              <a href={arahUrl} target="_blank" rel="noreferrer">
                <Navigation aria-hidden /> Buka petunjuk arah
              </a>
            </Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Posisi Anda</h2>
              <StatusPill nada={posisi ? "baik" : status === "gagal" ? "bahaya" : "netral"}>
                {posisi ? "GPS ditemukan" : status === "gagal" ? "Tidak tersedia" : "Belum diaktifkan"}
              </StatusPill>
            </div>

            {posisi ? (
              <div className="mt-5">
                <div className="flex items-end gap-2">
                  <Crosshair className="mb-1 size-5 text-primary" aria-hidden />
                  <p className="text-3xl font-bold text-foreground">
                    {jarak !== null && jarak < 1 ? `${Math.round(jarak * 1000)} m` : `${jarak?.toFixed(1)} km`}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Jarak garis lurus dari sekolah</p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Akurasi GPS sekitar {Math.round(posisi.akurasi)} meter.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-border bg-muted/60 p-4 text-center">
                <MapPin className="mx-auto size-7 text-muted-foreground" aria-hidden />
                <p className="mt-2 text-sm text-muted-foreground">
                  Izinkan akses lokasi untuk melihat jarak Anda dari sekolah.
                </p>
                {status === "gagal" ? (
                  <p className="mt-2 text-xs font-medium text-destructive">
                    GPS ditolak atau tidak tersedia. Periksa izin lokasi perangkat Anda.
                  </p>
                ) : null}
              </div>
            )}

            <Button variant="outline" asChild className="mt-4 w-full">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${sekolah.koordinat.latitude},${sekolah.koordinat.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink aria-hidden /> Lihat di Google Maps
              </a>
            </Button>
          </Card>
        </div>
      </section>
      ) : (
        <section className="grid min-h-80 place-items-center rounded-md border border-dashed border-border bg-muted/40 px-6 text-center">
          <div className="max-w-md">
            <MapPin className="mx-auto size-10 text-muted-foreground" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Belum ada sekolah dipilih</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Gunakan daftar pilihan di atas. Peta navigasi Google Maps dan GPS akan tampil setelah sekolah dipilih.
            </p>
          </div>
        </section>
      )}
    </AppShell>
  );
}