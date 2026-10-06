import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { muatUlangDataCloud } from "@/lib/data-cloud";
import { imporDataSekolah, type DataImpor } from "@/lib/data-sekolah.functions";

export const Route = createFileRoute("/impor-data")({
  head: () => ({
    meta: [
      { title: "Impor Data Excel — Guru, Siswa & Wali | SSMS" },
      { name: "description", content: "Unggah file Excel data guru, kelas, siswa & wali, dan kehadiran ke database sekolah." },
      { property: "og:title", content: "Impor Data Excel — SSMS" },
      { property: "og:description", content: "Unggah data sekolah dari template Excel ke database." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImporData,
});

type Sel = string | number | boolean | Date | null | undefined;

const str = (v: Sel) => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  return s === "" ? null : s;
};
const tgl = (v: Sel) => {
  const s = str(v);
  return s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
};
const angka = (v: Sel) => {
  const n = Number(v);
  return v === null || v === undefined || v === "" || Number.isNaN(n) ? null : Math.round(n);
};

function baris(sheets: { sheet: string; data: Sel[][] }[], nama: string) {
  const s = sheets.find((x) => x.sheet.toLowerCase() === nama.toLowerCase());
  return (s?.data.slice(1) ?? []).filter((r) => r.some((c) => str(c)));
}

function uraikan(sheets: { sheet: string; data: Sel[][] }[]): DataImpor {
  return {
    guru: baris(sheets, "Guru").filter((r) => str(r[0]) && str(r[1])).map((r) => ({
      nip: str(r[0])!, nama: str(r[1])!, jenis_kelamin: str(r[2]), jabatan: str(r[3]), mapel: str(r[4]),
      wali_kelas: str(r[5]), telp: str(r[6]), email: str(r[7]), status: str(r[8]),
    })),
    kelas: baris(sheets, "Kelas").filter((r) => str(r[0]) && angka(r[1])).map((r) => ({
      id: str(r[0])!.toUpperCase(), tingkat: angka(r[1])!, rombel: str(r[2]), nip_wali: str(r[3]), ruang: str(r[4]), kapasitas: angka(r[5]),
    })),
    siswa: baris(sheets, "Siswa & Wali").filter((r) => str(r[0]) && str(r[2]) && str(r[5])).map((r) => ({
      nisn: str(r[0])!, nis: str(r[1]), nama: str(r[2])!, jenis_kelamin: str(r[3]), tanggal_lahir: tgl(r[4]),
      kelas_id: str(r[5])!.toUpperCase(), alamat: str(r[6]), nama_ayah: str(r[7]), nama_ibu: str(r[8]),
      nama_wali: str(r[9]), telp_wali: str(r[10]), email_wali: str(r[11]),
    })),
    kehadiran: baris(sheets, "Kehadiran")
      .filter((r) => tgl(r[0]) && str(r[1]) && str(r[3]) && ["Hadir", "Terlambat", "Izin", "Sakit", "Alfa"].includes(str(r[4]) ?? ""))
      .map((r) => ({
        tanggal: tgl(r[0])!, nisn: str(r[1])!, kelas_id: str(r[3])!.toUpperCase(),
        status: str(r[4]) as DataImpor["kehadiran"][number]["status"], keterangan: str(r[5]),
      })),
  };
}

function ImporData() {
  const { bolehAkses, bolehUbah } = useAuth();
  const [data, setData] = useState<DataImpor | null>(null);
  const [namaFile, setNamaFile] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);

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
      const hasil = uraikan(sheets);
      if (!hasil.guru.length && !hasil.siswa.length && !hasil.kelas.length) {
        setPesan({ ok: false, teks: "Tidak ada data yang terbaca. Pastikan memakai template SSMS." });
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
      const r = await imporDataSekolah({ data });
      await muatUlangDataCloud();
      setPesan({ ok: true, teks: `Tersimpan: ${r.guru} guru, ${r.kelas} kelas, ${r.siswa} siswa & wali, ${r.kehadiran} catatan kehadiran.` });
      setData(null);
    } catch (e) {
      console.error(e);
      setPesan({ ok: false, teks: "Gagal menyimpan. Periksa isian file lalu coba lagi." });
    } finally {
      setProses(false);
    }
  }

  const ringkas = data && [
    ["Guru", data.guru.length],
    ["Kelas", data.kelas.length],
    ["Siswa & Wali", data.siswa.length],
    ["Kehadiran", data.kehadiran.length],
  ] as const;

  return (
    <AppShell>
      <PageHeader judul="Impor Data Excel" deskripsi="Unggah template Excel yang sudah diisi guru. Data dengan NIP/NISN yang sama akan diperbarui." />
      <Card className="p-5">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:bg-muted/50">
          <FileSpreadsheet className="h-10 w-10 text-primary" />
          <span className="font-medium">{namaFile || "Pilih file Excel (.xlsx)"}</span>
          <span className="text-sm text-muted-foreground">Sheet yang dibaca: Guru, Kelas, Siswa & Wali, Kehadiran</span>
          <input type="file" accept=".xlsx" className="sr-only" aria-label="Pilih file Excel" onChange={(e) => void pilihFile(e.target.files?.[0])} />
        </label>

        {ringkas && (
          <div className="mt-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ringkas.map(([l, n]) => (
                <div key={l} className="rounded-lg bg-muted p-3">
                  <div className="text-sm text-muted-foreground">{l}</div>
                  <div className="text-2xl font-semibold">{n}</div>
                </div>
              ))}
            </div>
            <Button className="mt-4" onClick={() => void simpan()} disabled={proses}>
              {proses ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Simpan ke database
            </Button>
          </div>
        )}

        {pesan && (
          <div className={`mt-4 rounded-lg p-3 text-sm ${pesan.ok ? "bg-accent text-foreground" : "bg-destructive/10 text-destructive"}`}>
            {pesan.ok && <CheckCircle2 className="mr-2 inline h-4 w-4" />}
            {pesan.teks}
            {pesan.ok && (
              <span className="mt-2 flex flex-wrap gap-3">
                <Link to="/akademik" className="underline">Lihat Akademik</Link>
                <Link to="/kehadiran" className="underline">Lihat Kehadiran</Link>
                <Link to="/master-data" className="underline">Lihat Kelas & Siswa</Link>
              </span>
            )}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
