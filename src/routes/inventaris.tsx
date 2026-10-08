import { createFileRoute } from "@tanstack/react-router";
import { Boxes, PackageCheck, QrCode, Wrench } from "lucide-react";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ASET, MAINTENANCE, PEMINJAMAN_ASET, rupiah } from "@/lib/demo-data";
import { WarehouseDemo } from "@/components/warehouse-demo";

export const Route = createFileRoute("/inventaris")({
  head: () => ({
    meta: [
      { title: "Inventaris — Aset QR/RFID & Peminjaman | SMS" },
      {
        name: "description",
        content:
          "Pencatatan aset sekolah berkode QR/RFID, peminjaman dan pengembalian, stock opname, serta jadwal pemeliharaan sarana prasarana.",
      },
      { property: "og:title", content: "Modul Inventaris — SMS Sekolah" },
      {
        property: "og:description",
        content: "Aset berkode, peminjaman, kondisi barang, dan jadwal maintenance.",
      },
    ],
  }),
  component: Inventaris,
});

function Inventaris() {
  const nilai = ASET.reduce((a, b) => a + b.nilai, 0);

  return (
    <AppShell>
      <PageHeader
        judul="Inventaris"
        deskripsi="Kelola aset tetap dan persediaan barang habis pakai dalam satu tempat."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total aset tercatat"
          nilai={ASET.length}
          keterangan="Terdaftar dengan kode unik"
          icon={Boxes}
        />
        <StatCard
          label="Nilai perolehan"
          nilai={rupiah(nilai)}
          keterangan="Akumulasi aset aktif"
          icon={QrCode}
        />
        <StatCard
          label="Sedang dipinjam"
          nilai={PEMINJAMAN_ASET.filter((p) => p.status !== "Selesai").length}
          keterangan="1 melewati tanggal kembali"
          icon={PackageCheck}
        />
        <StatCard
          label="Perlu perbaikan"
          nilai={ASET.filter((a) => a.status === "Perbaikan").length}
          keterangan="Dijadwalkan bersama vendor"
          icon={Wrench}
        />
      </section>

      <Tabs defaultValue="gudang" className="mt-6">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="gudang">Gudang harian</TabsTrigger>
          <TabsTrigger value="aset">Daftar aset</TabsTrigger>
          <TabsTrigger value="pinjam">Peminjaman</TabsTrigger>
          <TabsTrigger value="maintenance">Pemeliharaan</TabsTrigger>
        </TabsList>

        <TabsContent value="gudang" className="mt-4">
          <WarehouseDemo />
        </TabsContent>

        <TabsContent value="aset" className="mt-4">
          <TabelData
            judul="Daftar aset sekolah"
            deskripsi="Setiap aset memiliki kode QR/RFID untuk stock opname cepat."
            data={ASET}
            kolom={[
              { judul: "Kode", render: (a) => a.kode },
              { judul: "Nama aset", render: (a) => <span className="font-medium">{a.nama}</span> },
              { judul: "Kategori", render: (a) => a.kategori },
              { judul: "Lokasi", render: (a) => a.lokasi },
              {
                judul: "Kondisi",
                render: (a) => <StatusPill nada={nadaStatus(a.kondisi)}>{a.kondisi}</StatusPill>,
              },
              {
                judul: "Status",
                render: (a) => <StatusPill nada={nadaStatus(a.status)}>{a.status}</StatusPill>,
              },
              { judul: "Nilai", kanan: true, render: (a) => rupiah(a.nilai) },
            ]}
          />
        </TabsContent>

        <TabsContent value="pinjam" className="mt-4">
          <TabelData
            judul="Riwayat peminjaman aset"
            data={PEMINJAMAN_ASET}
            kolom={[
              { judul: "ID", render: (p) => p.id },
              { judul: "Aset", render: (p) => <span className="font-medium">{p.aset}</span> },
              { judul: "Peminjam", render: (p) => p.peminjam },
              { judul: "Tgl pinjam", render: (p) => p.tanggal },
              { judul: "Tgl kembali", render: (p) => p.kembali },
              {
                judul: "Status",
                render: (p) => <StatusPill nada={nadaStatus(p.status)}>{p.status}</StatusPill>,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <TabelData
            judul="Jadwal pemeliharaan"
            data={MAINTENANCE}
            kolom={[
              { judul: "ID", render: (m) => m.id },
              { judul: "Aset", render: (m) => <span className="font-medium">{m.aset}</span> },
              { judul: "Jenis", render: (m) => m.jenis },
              { judul: "Jadwal", render: (m) => m.jadwal },
              { judul: "Pelaksana", render: (m) => m.teknisi },
              {
                judul: "Status",
                render: (m) => <StatusPill nada={nadaStatus(m.status)}>{m.status}</StatusPill>,
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
