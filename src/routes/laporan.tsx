import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ClipboardList, Loader2, Sparkle } from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeader, StatusPill } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { SCHOOL } from "@/lib/demo-data";
import {
  analisisLaporanSekolah,
  type HasilAnalisisLaporan,
} from "@/lib/laporan.functions";

export const Route = createFileRoute("/laporan")({
  head: () => ({
    meta: [
      { title: "Analisis Laporan Sekolah dengan AI | SDN Kebagusan 01 Pagi" },
      {
        name: "description",
        content:
          "Kepala sekolah memasukkan teks laporan sekolah lalu memperoleh ringkasan otomatis, poin utama, risiko, dan rekomendasi tindak lanjut.",
      },
      { property: "og:title", content: "Analisis Laporan Sekolah dengan AI" },
      {
        property: "og:description",
        content: "Ringkasan dan rekomendasi tindak lanjut laporan sekolah secara otomatis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LaporanAI,
});

const CONTOH = `Kehadiran siswa bulan ini 94,2 persen, turun 1,8 persen dibanding bulan lalu terutama di kelas 5.
Nilai rata-rata ulangan harian Matematika kelas 4 hanya 68, di bawah KKM 70.
Serapan dana BOS triwulan ini 71 persen, pembelian buku perpustakaan belum direalisasi.
Dua unit AC ruang kelas 6 rusak dan tiga proyektor perlu perawatan.
Kegiatan ekstrakurikuler pramuka berjalan baik dengan partisipasi 85 persen siswa.`;

function LaporanAI() {
  const { bolehAkses } = useAuth();
  const jalankan = useServerFn(analisisLaporanSekolah);

  const [judul, setJudul] = useState("Laporan Bulanan Operasional Sekolah");
  const [periode, setPeriode] = useState("September 2026");
  const [teks, setTeks] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilAnalisisLaporan | null>(null);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setGalat(null);
    setHasil(null);
    setMemuat(true);
    try {
      const data = await jalankan({ data: { judul, periode, teks } });
      setHasil(data);
    } catch (error) {
      setGalat(
        error instanceof Error
          ? error.message
          : "Analisis gagal diproses. Silakan coba lagi beberapa saat lagi.",
      );
    } finally {
      setMemuat(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        judul="Analisis Laporan Sekolah (AI)"
        deskripsi={`Masukkan teks laporan ${SCHOOL.nama} untuk memperoleh ringkasan, risiko, dan rekomendasi tindak lanjut.`}
      />

      {!bolehAkses("laporan") ? null : (
        <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="p-5">
            <form onSubmit={kirim} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="judul">Judul laporan</Label>
                  <Input id="judul" value={judul} onChange={(e) => setJudul(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="periode">Periode</Label>
                  <Input id="periode" value={periode} onChange={(e) => setPeriode(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="teks">Teks laporan</Label>
                <Textarea
                  id="teks"
                  value={teks}
                  onChange={(e) => setTeks(e.target.value)}
                  rows={12}
                  placeholder="Tempel atau ketik isi laporan sekolah di sini…"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {teks.trim().length} karakter · minimal 40 karakter.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={memuat || teks.trim().length < 40}>
                  {memuat ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Menganalisis…
                    </>
                  ) : (
                    <>
                      <Sparkle className="size-4" aria-hidden /> Buat ringkasan & rekomendasi
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setTeks(CONTOH)}>
                  Isi contoh laporan
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ClipboardList className="size-4 text-primary" aria-hidden /> Hasil analisis
            </h2>

            {galat ? (
              <p className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {galat}
              </p>
            ) : null}

            {!hasil && !galat ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {memuat
                  ? "Sedang menyusun ringkasan dan rekomendasi tindak lanjut…"
                  : "Hasil ringkasan, poin utama, risiko, dan rekomendasi tindak lanjut akan tampil di sini."}
              </p>
            ) : null}

            {hasil ? (
              <div className="mt-4 space-y-5">
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ringkasan
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground">{hasil.ringkasan}</p>
                </section>

                {hasil.poinUtama.length ? (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Poin utama
                    </h3>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground">
                      {hasil.poinUtama.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {hasil.rekomendasi.length ? (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Rekomendasi tindak lanjut
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {hasil.rekomendasi.map((r) => (
                        <li key={r.judul} className="rounded-md border border-border p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{r.judul}</p>
                            <StatusPill
                              nada={
                                r.prioritas === "Tinggi"
                                  ? "bahaya"
                                  : r.prioritas === "Sedang"
                                    ? "peringatan"
                                    : "netral"
                              }
                            >
                              {r.prioritas}
                            </StatusPill>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{r.langkah}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            PJ: {r.penanggungJawab} · Tenggat: {r.tenggat}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {hasil.risiko.length ? (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Risiko yang perlu diawasi
                    </h3>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground">
                      {hasil.risiko.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
