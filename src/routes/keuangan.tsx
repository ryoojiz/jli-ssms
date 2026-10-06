import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, PiggyBank, Receipt, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell, PageHeader, StatusPill, nadaStatus } from "@/components/app-shell";
import { TabelData } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ANGGARAN, ARUS_KAS, TRANSAKSI, rupiah } from "@/lib/demo-data";

export const Route = createFileRoute("/keuangan")({
  head: () => ({
    meta: [
      { title: "Keuangan — BOS, Anggaran & Approval | SMS" },
      {
        name: "description",
        content:
          "Pengelolaan dana BOS: pagu anggaran, realisasi, transaksi pemasukan dan pengeluaran, alur persetujuan, serta laporan keuangan sekolah.",
      },
      { property: "og:title", content: "Modul Keuangan — SMS Sekolah" },
      {
        property: "og:description",
        content: "Anggaran BOS, transaksi, approval berjenjang, dan laporan serapan.",
      },
    ],
  }),
  component: Keuangan,
});

function Keuangan() {
  const pagu = ANGGARAN.reduce((a, b) => a + b.pagu, 0);
  const realisasi = ANGGARAN.reduce((a, b) => a + b.realisasi, 0);
  const menunggu = TRANSAKSI.filter((t) => t.status === "Menunggu");

  return (
    <AppShell>
      <PageHeader
        judul="Keuangan"
        deskripsi="Anggaran BOS, transaksi, persetujuan berjenjang, dan laporan serapan dana."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total pagu" nilai={rupiah(pagu)} keterangan="Tahun anggaran 2026" icon={PiggyBank} />
        <StatCard label="Realisasi" nilai={rupiah(realisasi)} keterangan={`${Math.round((realisasi / pagu) * 100)}% terserap`} icon={TrendingUp} />
        <StatCard label="Sisa pagu" nilai={rupiah(pagu - realisasi)} keterangan="Tersedia untuk dibelanjakan" icon={Receipt} />
        <StatCard label="Menunggu approval" nilai={menunggu.length} keterangan={rupiah(menunggu.reduce((a, b) => a + b.nominal, 0))} icon={BadgeCheck} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Arus kas 6 bulan terakhir</h2>
          <p className="mb-4 text-xs text-muted-foreground">Dalam juta rupiah.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ARUS_KAS}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  formatter={(v: number, n) => [`Rp ${v} jt`, n === "masuk" ? "Pemasukan" : "Pengeluaran"]}
                  contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="masuk" name="Pemasukan" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="keluar" name="Pengeluaran" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Serapan per program</h2>
          <ul className="mt-4 space-y-4">
            {ANGGARAN.map((a) => {
              const persen = Math.round((a.realisasi / a.pagu) * 100);
              return (
                <li key={a.id}>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="font-medium text-foreground">{a.kode}</span>
                    <span className="tabular-nums text-muted-foreground">{persen}%</span>
                  </div>
                  <p className="text-[0.7rem] text-muted-foreground">{a.program}</p>
                  <Progress value={persen} className="mt-1.5 h-2" />
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <div className="mt-6 space-y-6">
        <TabelData
          judul="Rencana Kegiatan dan Anggaran Sekolah (RKAS)"
          data={ANGGARAN}
          kolom={[
            { judul: "Kode", render: (a) => a.kode },
            { judul: "Program", render: (a) => <span className="font-medium">{a.program}</span> },
            { judul: "Pagu", kanan: true, render: (a) => rupiah(a.pagu) },
            { judul: "Realisasi", kanan: true, render: (a) => rupiah(a.realisasi) },
            { judul: "Sisa", kanan: true, render: (a) => rupiah(a.pagu - a.realisasi) },
          ]}
        />

        <TabelData
          judul="Transaksi terbaru"
          deskripsi="Setiap perubahan status transaksi tercatat pada audit trail."
          data={TRANSAKSI}
          kolom={[
            { judul: "ID", render: (t) => t.id },
            { judul: "Tanggal", render: (t) => t.tanggal },
            { judul: "Uraian", render: (t) => <span className="font-medium">{t.uraian}</span> },
            { judul: "Kode", render: (t) => t.kategori },
            {
              judul: "Jenis",
              render: (t) => (
                <StatusPill nada={t.jenis === "Pemasukan" ? "info" : "netral"}>{t.jenis}</StatusPill>
              ),
            },
            { judul: "Nominal", kanan: true, render: (t) => rupiah(t.nominal) },
            { judul: "Status", render: (t) => <StatusPill nada={nadaStatus(t.status)}>{t.status}</StatusPill> },
          ]}
        />
      </div>
    </AppShell>
  );
}
