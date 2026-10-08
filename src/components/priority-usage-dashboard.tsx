import { Link } from "@tanstack/react-router";
import { BookOpen, Boxes, CalendarCheck, ChartNoAxesCombined, GraduationCap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useDemoWorkflow } from "@/lib/demo-workflow";
import { usePriorityDemo } from "@/lib/priority-demo";
import { summarizePriorityUsage } from "@/lib/priority-usage";

function ratio(done: number, total: number) {
  return total === 0
    ? "Belum cukup data"
    : `${Math.round((done / total) * 100)}% (${done}/${total})`;
}

export function PriorityUsageDashboard() {
  const { sesi } = useAuth();
  const priority = usePriorityDemo();
  const workflow = useDemoWorkflow();
  if (!sesi || !["kepala_sekolah", "operator", "auditor"].includes(sesi.peran)) return null;

  const usage = summarizePriorityUsage(priority, workflow);
  const cards = [
    {
      label: "Gudang barang habis pakai",
      value: usage.warehouse.handovers,
      unit: "penyerahan",
      details: `${usage.warehouse.pending} permintaan menunggu · ${usage.warehouse.approvedCounts} opname disetujui`,
      icon: Boxes,
      to: "/inventaris" as const,
    },
    {
      label: "Kehadiran harian",
      value: usage.attendance.records,
      unit: "catatan siswa–tanggal",
      details: `${usage.attendance.pendingRequests} permohonan izin/sakit menunggu`,
      icon: CalendarCheck,
      to: "/kehadiran" as const,
    },
    {
      label: "Kunjungan perpustakaan",
      value: usage.library.visits,
      unit: "kunjungan terlaksana",
      details: `${usage.library.visitors} pengunjung tercatat · ${usage.library.pending} booking menunggu`,
      icon: BookOpen,
      to: "/perpustakaan" as const,
    },
    {
      label: "Penilaian siswa",
      value: usage.grades.published,
      unit: "penilaian terbit",
      details: `${usage.grades.publishedScores} entri nilai terbit · ${usage.grades.drafts} draft`,
      icon: GraduationCap,
      to: "/akademik" as const,
    },
    {
      label: "KPI administrasi guru",
      value: usage.teacher.active,
      unit: "guru aktif menilai",
      details: `Kelengkapan ${ratio(usage.teacher.entriesDone, usage.teacher.entriesTotal)} · Tepat waktu ${ratio(usage.teacher.onTime, usage.teacher.deadlineTotal)}`,
      icon: ChartNoAxesCombined,
      to: "/analitik" as const,
    },
  ];

  return (
    <section className="mt-6" aria-labelledby="priority-usage-heading">
      <div className="mb-3">
        <h2 id="priority-usage-heading" className="text-lg font-semibold text-foreground">
          Laporan penggunaan modul prioritas
        </h2>
        <p className="text-sm text-muted-foreground">
          Ringkasan aktivitas gudang, kehadiran, perpustakaan, penilaian, dan administrasi guru
          untuk seluruh tanggal dan semester. KPI guru mengukur proses administrasi penilaian,
          bukan kinerja kepegawaian.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="gap-0 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </h3>
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.unit}</p>
              <p className="mt-2 flex-1 text-xs text-muted-foreground">{card.details}</p>
              <Link
                to={card.to}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                Lihat modul →
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
