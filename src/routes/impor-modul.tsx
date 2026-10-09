import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { ambilDataModul, imporDataModul } from "@/lib/data-modul.functions";
import { MODUL_IMPOR } from "@/lib/modul-impor";
import { muatUlangDataCloud } from "@/lib/data-cloud";

export const Route = createFileRoute("/impor-modul")({
  head: () => ({
    meta: [
      { title: "Impor Data per Modul — KPI, Akademik, Keuangan & lainnya | SSMS" },
      {
        name: "description",
        content:
          "Unggah file Excel terpisah per modul dashboard: KPI, akademik, keuangan, inventaris, perpustakaan, kesehatan, komunikasi, keamanan.",
      },
      { property: "og:title", content: "Impor Data per Modul — SSMS" },
      {
        property: "og:description",
        content: "Unggah Excel terpisah per modul agar hanya data itu yang diperbarui.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImporModul,
});

type Sel = string | number | boolean | Date | null | undefined;
type Baris = { kunci: string; data: Record<string, string | number | boolean | null> };

const nilai = (v: Sel): string | number | boolean | null => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date)
    return v
      .toISOString()
      .slice(0, v.getUTCHours() || v.getUTCMinutes() ? 16 : 10)
      .replace("T", " ");
  if (typeof v === "string") return v.trim() === "" ? null : v.trim();
  return v;
};

function ImporModul() {
  const { bolehAkses, bolehUbah } = useAuth();
  const [modulId, setModulId] = useState(MODUL_IMPOR[0]!.id);
  const modul = MODUL_IMPOR.find((m) => m.id === modulId)!;
  const [data, setData] = useState<{ nama: string; baris: Baris[] }[] | null>(null);
  const [namaFile, setNamaFile] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [tersimpan, setTersimpan] = useState<Awaited<ReturnType<typeof ambilDataModul>>["rows"]>(
    [],
  );

  const muat = useCallback(async () => {
    const r = await ambilDataModul({ data: { modul: modulId } });
    setTersimpan(r.rows);
  }, [modulId]);

  useEffect(() => {
    setData(null);
    setNamaFile("");
    setPesan(null);
    void muat();
  }, [muat]);

  if (!bolehAkses("master-data") || !bolehUbah("master-data")) {
    return (
      <AppShell>
        <PageHeader judul="Akses ditolak" deskripsi="Menu ini khusus Operator / Admin Sekolah." />
      </AppShell>
    );
  }

  async function pilihFile(file: File | undefined) {
    setPesan(null);
    setData(null);
    if (!file) return;
    setNamaFile(file.name);
    try {
      const { default: readXlsxFile } = await import("read-excel-file/browser");
      const sheets = (await readXlsxFile(file)) as unknown as { sheet: string; data: Sel[][] }[];
      const hasil = modul.lembar.map((l) => {
        const s = sheets.find((x) => x.sheet.trim().toLowerCase() === l.nama.toLowerCase());
        const baris: Baris[] = [];
        for (const r of s?.data.slice(1) ?? []) {
          const vals = l.kolom.map((_, i) => nilai(r[i]));
          const kunci = l.kunci.map((i) => vals[i]);
          if (kunci.some((k) => k === null)) continue;
          baris.push({
            kunci: kunci.join("|"),
            data: Object.fromEntries(l.kolom.map((k, i) => [k, vals[i] ?? null])),
          });
        }
        return { nama: l.nama, baris };
      });
      if (!hasil.some((h) => h.baris.length)) {
        setPesan({
          ok: false,
          teks: `Tidak ada data terbaca. Pastikan memakai template modul ${modul.label} dan kolom kunci terisi.`,
        });
        return;
      }
      setData(hasil);
    } catch (e) {
      console.error(e);
      setPesan({ ok: false, teks: "File tidak bisa dibaca. Pastikan formatnya .xlsx." });
    }
  }

  async function simpan() {
    if (!data) return;
    setProses(true);
    setPesan(null);
    try {
      const r = await imporDataModul({
        data: { modul: modulId, lembar: data.filter((d) => d.baris.length) },
      });
      setPesan({
        ok: true,
        teks: `Tersimpan: ${Object.entries(r)
          .map(([k, n]) => `${n} baris ${k}`)
          .join(", ")}.`,
      });
      setData(null);
      await muat();
      await muatUlangDataCloud();
    } catch (e) {
      console.error(e);
      setPesan({ ok: false, teks: "Gagal menyimpan. Periksa isian file lalu coba lagi." });
    } finally {
      setProses(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        judul="Impor Data per Modul"
        deskripsi="Pilih modul, unduh template-nya, isi, lalu unggah. Hanya data modul itu yang diperbarui; baris dengan kunci sama akan ditimpa."
      />
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={modulId} onValueChange={setModulId}>
            <SelectTrigger className="sm:w-80" aria-label="Pilih modul">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODUL_IMPOR.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <a href={modul.file} download={`Template_Impor_${modul.id}.xlsx`}>
              <Download className="mr-2 h-4 w-4" /> Unduh template {modul.label}
            </a>
          </Button>
        </div>

        <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:bg-muted/50">
          <FileSpreadsheet className="h-10 w-10 text-primary" />
          <span className="font-medium">{namaFile || "Pilih file Excel (.xlsx)"}</span>
          <span className="text-sm text-muted-foreground">
            Sheet yang dibaca: {modul.lembar.map((l) => l.nama).join(", ")}
          </span>
          <input
            key={modulId}
            type="file"
            accept=".xlsx"
            className="sr-only"
            aria-label="Pilih file Excel"
            onChange={(e) => void pilihFile(e.target.files?.[0])}
          />
        </label>

        {data && (
          <div className="mt-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.map((d) => (
                <div key={d.nama} className="rounded-lg bg-muted p-3">
                  <div className="text-sm text-muted-foreground">{d.nama}</div>
                  <div className="text-2xl font-semibold">{d.baris.length}</div>
                </div>
              ))}
            </div>
            <Button className="mt-4" onClick={() => void simpan()} disabled={proses}>
              {proses ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Simpan ke database
            </Button>
          </div>
        )}

        {pesan && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm ${pesan.ok ? "bg-accent text-foreground" : "bg-destructive/10 text-destructive"}`}
          >
            {pesan.ok && <CheckCircle2 className="mr-2 inline h-4 w-4" />}
            {pesan.teks}
          </div>
        )}
      </Card>

      {modul.lembar.map((l) => {
        const rows = tersimpan.filter((r) => r.lembar === l.nama);
        return (
          <Card key={l.nama} className="mt-4 p-5">
            <div className="mb-3 font-semibold">
              {l.nama}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                — {rows.length} baris tersimpan
              </span>
            </div>
            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      {l.kolom.map((k) => (
                        <th key={k} className="whitespace-nowrap px-2 py-1 font-medium">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((r) => (
                      <tr key={r.kunci} className="border-b last:border-0">
                        {l.kolom.map((k) => (
                          <td key={k} className="whitespace-nowrap px-2 py-1">
                            {String(r.data[k] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            )}
          </Card>
        );
      })}
    </AppShell>
  );
}
