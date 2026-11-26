import { Link } from "@tanstack/react-router";
import { BookOpen, Boxes, CalendarCheck, ChartNoAxesCombined, GraduationCap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { GAYA_AKSEN, type AksenKpi } from "@/components/stat-card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useDemoWorkflow } from "@/lib/workflow-store";
import { usePriorityDemo } from "@/lib/priority-store";
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
  if (!sesi || !["kepala_sekolah", "operator", "auditor", "pusat"].includes(sesi.peran))
    return null;

  const usage = summarizePriorityUsage(priority, workflow);
  const cards = [
    {
      label: "Gudang barang habis pakai",
      value: usage.warehouse.handovers,
      unit: "penyerahan",
      details: `${usage.warehouse.pending} permintaan menunggu · ${usage.warehouse.approvedCounts} opname disetujui`,
      icon: Boxes,
      aksen: "warning" as const,
      to: "/inventaris" as const,
    },
    {
      label: "Kehadiran harian",
      value: usage.attendance.records,
      unit: "catatan siswa–tanggal",
      details: `${usage.attendance.pendingRequests} permohonan izin/sakit menunggu`,
      icon: CalendarCheck,
      aksen: "success" as const,
      to: "/kehadiran" as const,
    },
    {
      label: "Kunjungan perpustakaan",
      value: usage.library.visits,
      unit: "kunjungan terlaksana",
      details: `${usage.library.visitors} pengunjung tercatat · ${usage.library.pending} booking menunggu`,
      icon: BookOpen,
      aksen: "info" as const,
      to: "/perpustakaan" as const,
    },
    {
      label: "Penilaian siswa",
      value: usage.grades.published,
      unit: "penilaian terbit",
      details: `${usage.grades.publishedScores} entri nilai terbit · ${usage.grades.drafts} draft`,
      icon: GraduationCap,
      aksen: "primary" as const,
      to: "/akademik" as const,
    },
    {
      label: "KPI administrasi guru",
      value: usage.teacher.active,
      unit: "guru aktif menilai",
      details: `Kelengkapan ${ratio(usage.teacher.entriesDone, usage.teacher.entriesTotal)} · Tepat waktu ${ratio(usage.teacher.onTime, usage.teacher.deadlineTotal)}`,
      icon: ChartNoAxesCombined,
      aksen: "danger" as const,
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
          untuk seluruh tanggal dan semester. KPI guru mengukur proses administrasi penilaian, bukan
          kinerja kepegawaian.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="flex h-full flex-col gap-0 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </h3>
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-md",
                    GAYA_AKSEN[card.aksen as AksenKpi],
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.unit}</p>
              <div className="mt-auto pt-2">
                <p className="text-xs text-muted-foreground">{card.details}</p>
                <Link
                  to={card.to}
                  className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  Lihat modul →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
