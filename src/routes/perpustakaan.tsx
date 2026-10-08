import { createFileRoute } from "@tanstack/react-router";
import { AlarmClock, BookCopy, BookOpen, Library } from "lucide-react";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BUKU, SIRKULASI } from "@/lib/demo-data";
import { SISWA } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";
import { LibraryBookingDemo } from "@/components/library-booking-demo";

export const Route = createFileRoute("/perpustakaan")({
  head: () => ({
    meta: [
      { title: "Perpustakaan — Katalog & Sirkulasi RFID | SMS" },
      {
        name: "description",
        content:
          "Katalog buku digital, sirkulasi peminjaman dan pengembalian berbasis RFID/QR, serta pemantauan keterlambatan koleksi perpustakaan sekolah.",
      },
      { property: "og:title", content: "Modul Perpustakaan — SMS Sekolah" },
      {
        property: "og:description",
        content: "Katalog, sirkulasi RFID/QR, dan daftar keterlambatan pengembalian.",
      },
    ],
  }),
  component: Perpustakaan,
});

function Perpustakaan() {
  const { sesi } = useAuth();
  const waliMurid = sesi?.peran === "walimurid";
  const anak = SISWA.find((s) => s.id === sesi?.siswaId);
  const sirkulasi = waliMurid ? SIRKULASI.filter((s) => s.peminjam === anak?.nama) : SIRKULASI;
  const stok = BUKU.reduce((a, b) => a + b.stok, 0);
  const tersedia = BUKU.reduce((a, b) => a + b.tersedia, 0);

  return (
    <AppShell>
      <PageHeader
        judul={waliMurid ? "Perpustakaan Anak" : "Perpustakaan"}
        deskripsi={
          waliMurid
            ? `Katalog dan riwayat peminjaman contoh ${anak?.nama ?? "anak Anda"}.`
            : "Katalog dan sirkulasi contoh; booking ruang adalah alur demo satu browser."
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Judul koleksi"
          nilai={BUKU.length}
          keterangan="Terkatalog dengan ISBN"
          icon={Library}
        />
        <StatCard
          label="Total eksemplar"
          nilai={stok}
          keterangan={`${tersedia} tersedia di rak`}
          icon={BookCopy}
        />
        <StatCard
          label={waliMurid ? "Dipinjam anak" : "Sedang dipinjam"}
          nilai={
            waliMurid
              ? sirkulasi.filter((s) => s.status !== "Dikembalikan").length
              : stok - tersedia
          }
          keterangan="Sirkulasi aktif"
          icon={BookOpen}
        />
        <StatCard
          label="Terlambat · contoh"
          nilai={sirkulasi.filter((s) => s.status === "Terlambat").length}
          keterangan="Belum ada pengingat otomatis"
          icon={AlarmClock}
        />
      </section>

      <Tabs defaultValue="booking" className="mt-6">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="booking">Booking ruang</TabsTrigger>
          <TabsTrigger value="katalog">Katalog</TabsTrigger>
          <TabsTrigger value="sirkulasi">Sirkulasi</TabsTrigger>
        </TabsList>

        <TabsContent value="booking" className="mt-4">
          <LibraryBookingDemo />
        </TabsContent>

        <TabsContent value="katalog" className="mt-4">
          <TabelData
            judul="Katalog buku"
            data={BUKU}
            kolom={[
              { judul: "ISBN", render: (b) => b.isbn },
              { judul: "Judul", render: (b) => <span className="font-medium">{b.judul}</span> },
              { judul: "Pengarang", render: (b) => b.pengarang },
              { judul: "Kategori", render: (b) => <StatusPill>{b.kategori}</StatusPill> },
              { judul: "Stok", kanan: true, render: (b) => b.stok },
              { judul: "Tersedia", kanan: true, render: (b) => b.tersedia },
            ]}
          />
        </TabsContent>

        <TabsContent value="sirkulasi" className="mt-4">
          <TabelData
            judul="Sirkulasi peminjaman"
            deskripsi="Data sirkulasi contoh statis; belum terhubung ke peminjaman atau pengingat otomatis."
            data={sirkulasi}
            kolom={[
              { judul: "ID", render: (s) => s.id },
              { judul: "Buku", render: (s) => <span className="font-medium">{s.buku}</span> },
              { judul: "Peminjam", render: (s) => `${s.peminjam} (${s.kelas})` },
              { judul: "Tgl pinjam", render: (s) => s.pinjam },
              { judul: "Jatuh tempo", render: (s) => s.jatuhTempo },
              {
                judul: "Status",
                render: (s) => <StatusPill nada={nadaStatus(s.status)}>{s.status}</StatusPill>,
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
