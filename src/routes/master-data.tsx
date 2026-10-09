import { createFileRoute } from "@tanstack/react-router";
import { Database, History, School, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell, PageHeader, StatusPill } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { muatUlangDataCloud, useDataCloud } from "@/lib/data-cloud";
import { useAuth } from "@/lib/auth-context";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUDIT_LOG, GURU, KELAS, PERAN, SCHOOL, SISWA, namaKelas } from "@/lib/demo-data";

export const Route = createFileRoute("/master-data")({
  head: () => ({
    meta: [
      { title: "Master Data & Audit — Siswa, Guru, Peran | SMS" },
      {
        name: "description",
        content:
          "Master data sekolah: profil sekolah, data siswa dan guru, rombongan belajar, matriks peran akses (RBAC), serta jejak audit perubahan data.",
      },
      { property: "og:title", content: "Master Data & Audit — SMS Sekolah" },
      {
        property: "og:description",
        content: "Data siswa, guru, rombel, matriks RBAC, dan audit trail.",
      },
    ],
  }),
  component: MasterData,
});

function MasterData() {
  const { sesi } = useAuth();
  useDataCloud();
  useEffect(() => {
    if (sesi?.schoolId)
      void muatUlangDataCloud().catch((error) => console.error("Audit tidak dapat dimuat.", error));
  }, [sesi?.schoolId]);
  const [cari, setCari] = useState("");
  const siswa = SISWA.filter(
    (s) =>
      s.nama.toLowerCase().includes(cari.toLowerCase()) ||
      s.nisn.includes(cari) ||
      namaKelas(s.kelasId).toLowerCase().includes(cari.toLowerCase()),
  ).slice(0, 40);

  return (
    <AppShell>
      <PageHeader
        judul="Master Data & Audit"
        deskripsi="Sumber tunggal data sekolah, pengaturan peran akses, dan jejak audit perubahan."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Profil sekolah"
          nilai={SCHOOL.npsn}
          keterangan={SCHOOL.nama}
          icon={School}
        />
        <StatCard
          label="Data siswa"
          nilai={SISWA.length}
          keterangan="Terdaftar di sekolah aktif"
          icon={UsersRound}
        />
        <StatCard
          label="Data guru & tendik"
          nilai={GURU.length}
          keterangan="PNS, PPPK, honorer"
          icon={Database}
        />
        <StatCard
          label="Entri audit"
          nilai={AUDIT_LOG.length}
          keterangan="Riwayat perubahan tersimpan"
          icon={History}
        />
      </section>

      <Tabs defaultValue="siswa" className="mt-6">
        <TabsList>
          <TabsTrigger value="siswa">Siswa</TabsTrigger>
          <TabsTrigger value="guru">Guru</TabsTrigger>
          <TabsTrigger value="kelas">Rombel</TabsTrigger>
          <TabsTrigger value="peran">Peran akses</TabsTrigger>
          <TabsTrigger value="audit">Audit trail</TabsTrigger>
        </TabsList>

        <TabsContent value="siswa" className="mt-4">
          <TabelData
            judul="Data siswa"
            deskripsi={`Menampilkan ${siswa.length} dari ${SISWA.length} siswa.`}
            aksi={
              <Input
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari nama / NISN / kelas"
                className="w-56"
              />
            }
            data={siswa}
            kolom={[
              { judul: "NISN", render: (s) => s.nisn },
              { judul: "Nama", render: (s) => <span className="font-medium">{s.nama}</span> },
              { judul: "L/P", render: (s) => s.jenisKelamin },
              { judul: "Kelas", render: (s) => namaKelas(s.kelasId) },
              { judul: "Tag RFID", render: (s) => s.tagUid },
              { judul: "Wali", render: (s) => s.namaWali },
              { judul: "Telepon wali", render: (s) => s.telpWali },
            ]}
          />
        </TabsContent>

        <TabsContent value="guru" className="mt-4">
          <TabelData
            judul="Data guru & tenaga kependidikan"
            data={GURU}
            kolom={[
              { judul: "NIP", render: (g) => g.nip },
              { judul: "Nama", render: (g) => <span className="font-medium">{g.nama}</span> },
              { judul: "Penugasan", render: (g) => g.mapel },
              { judul: "Status", render: (g) => <StatusPill>{g.status}</StatusPill> },
            ]}
          />
        </TabsContent>

        <TabsContent value="kelas" className="mt-4">
          <TabelData
            judul="Rombongan belajar"
            data={KELAS}
            kolom={[
              { judul: "Kelas", render: (k) => <span className="font-medium">{k.nama}</span> },
              { judul: "Tingkat", render: (k) => k.tingkat },
              { judul: "Wali kelas", render: (k) => k.waliKelas },
              { judul: "Ruang", render: (k) => k.ruang },
              { judul: "Jumlah siswa", kanan: true, render: (k) => k.jumlahSiswa },
            ]}
          />
        </TabsContent>

        <TabsContent value="peran" className="mt-4">
          <TabelData
            judul="Matriks peran akses (RBAC)"
            deskripsi="Setiap peran dibatasi cakupan sekolah; auditor bersifat read-only."
            data={PERAN}
            kolom={[
              { judul: "Peran", render: (p) => <span className="font-medium">{p.peran}</span> },
              { judul: "Cakupan", render: (p) => <StatusPill nada="info">{p.cakupan}</StatusPill> },
              { judul: "Hak utama", render: (p) => p.hak },
            ]}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <TabelData
            judul="Audit trail"
            deskripsi="Menyimpan aktor, waktu, nilai sebelum/sesudah, dan alamat IP sumber."
            data={AUDIT_LOG}
            kolom={[
              { judul: "ID", render: (a) => a.id },
              { judul: "Waktu", render: (a) => a.waktu },
              { judul: "Aktor", render: (a) => a.aktor },
              { judul: "Aksi", render: (a) => <span className="font-medium">{a.aksi}</span> },
              { judul: "Sebelum", render: (a) => a.sebelum },
              { judul: "Sesudah", render: (a) => a.sesudah },
              { judul: "IP", render: (a) => a.ip },
            ]}
          />
        </TabsContent>
      </Tabs>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold text-foreground">Profil sekolah</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Nama sekolah", SCHOOL.nama],
            ["NPSN", SCHOOL.npsn],
            ["Kepala sekolah", SCHOOL.kepalaSekolah],
            ["Alamat", SCHOOL.alamat],
            ["Tahun ajaran", SCHOOL.tahunAjaran],
            ["Semester", SCHOOL.semester],
            ["Zona waktu", "Asia/Jakarta (UTC+7)"],
            ["ID tenant", SCHOOL.id],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </AppShell>
  );
}
