import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Phone, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell, PageHeader, StatusPill } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { namaKelas, rataRataSiswa } from "@/lib/demo-data";
import { kelasTanggungJawab, siswaTanggungJawab, tautanWhatsApp } from "@/lib/guru-data";

export const Route = createFileRoute("/siswa-saya")({
  head: () => ({
    meta: [
      { title: "Siswa & Wali — Kelas Ampuan Guru | SMS" },
      {
        name: "description",
        content:
          "Daftar siswa yang menjadi tanggung jawab guru lengkap dengan nama orang tua/wali dan tombol hubungi lewat WhatsApp atau telepon.",
      },
      { property: "og:title", content: "Siswa & Wali — SMS Sekolah" },
      {
        property: "og:description",
        content: "Daftar siswa ampuan guru beserta kontak orang tua/wali.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SiswaSaya,
});

function SiswaSaya() {
  const { sesi } = useAuth();
  const kelas = kelasTanggungJawab(sesi);
  const semua = siswaTanggungJawab(sesi);
  const [kelasId, setKelasId] = useState("semua");
  const [cari, setCari] = useState("");

  const data = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return semua.filter(
      (s) =>
        (kelasId === "semua" || s.kelasId === kelasId) &&
        (!q || s.nama.toLowerCase().includes(q) || s.namaWali.toLowerCase().includes(q)),
    );
  }, [semua, kelasId, cari]);

  return (
    <AppShell>
      <PageHeader
        judul="Siswa & Wali"
        deskripsi="Daftar siswa yang menjadi tanggung jawab Anda beserta kontak orang tua/wali."
        aksi={
          <>
            <Input
              placeholder="Cari nama siswa atau wali…"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className="w-56"
            />
            <Select value={kelasId} onValueChange={setKelasId}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua kelas</SelectItem>
                {kelas.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    Kelas {k.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Kelas diampu" nilai={kelas.length} keterangan={kelas.map((k) => k.nama).join(", ")} icon={Users} />
        <StatCard label="Total siswa" nilai={semua.length} keterangan="Seluruh kelas ampuan" icon={Users} />
        <StatCard label="Ditampilkan" nilai={data.length} keterangan="Sesuai filter & pencarian" icon={Users} />
      </section>

      <div className="mt-6">
        <TabelData
          judul="Daftar siswa & kontak wali"
          deskripsi="Gunakan tombol hubungi untuk mengirim pesan WhatsApp atau menelepon orang tua/wali."
          data={data}
          kolom={[
            { judul: "NISN", render: (s) => s.nisn },
            { judul: "Nama siswa", render: (s) => <span className="font-medium">{s.nama}</span> },
            { judul: "Kelas", render: (s) => namaKelas(s.kelasId) },
            { judul: "L/P", render: (s) => s.jenisKelamin },
            { judul: "Orang tua / wali", render: (s) => s.namaWali },
            { judul: "Telepon wali", render: (s) => <span className="tabular-nums">{s.telpWali}</span> },
            {
              judul: "Rata-rata",
              kanan: true,
              render: (s) => {
                const r = rataRataSiswa(s.id);
                return <StatusPill nada={r >= 80 ? "baik" : r >= 70 ? "peringatan" : "bahaya"}>{r}</StatusPill>;
              },
            },
            {
              judul: "Hubungi",
              kanan: true,
              render: (s) => (
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={tautanWhatsApp(
                        s.telpWali,
                        `Assalamualaikum Bapak/Ibu ${s.namaWali}, saya guru kelas ${namaKelas(s.kelasId)} ingin menyampaikan perkembangan ananda ${s.nama}.`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <a href={`tel:${s.telpWali}`} aria-label={`Telepon wali ${s.nama}`}>
                      <Phone className="size-4" />
                    </a>
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
