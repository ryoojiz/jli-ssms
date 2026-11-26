import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AksenKpi = "primary" | "info" | "success" | "warning" | "danger";

export const GAYA_AKSEN: Record<AksenKpi, string> = {
  primary: "bg-primary/15 text-primary",
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  danger: "bg-destructive/15 text-destructive",
};

export function StatCard({
  label,
  nilai,
  satuan,
  keterangan,
  icon: Icon,
  aksen = "primary",
}: {
  label: string;
  nilai: ReactNode;
  satuan?: string;
  keterangan?: string;
  icon: LucideIcon;
  aksen?: AksenKpi;
}) {
  return (
    <Card className="flex h-full flex-col gap-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span
          className={cn("grid size-8 shrink-0 place-items-center rounded-md", GAYA_AKSEN[aksen])}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
        {nilai}
        {satuan ? (
          <span className="ml-1 text-base font-semibold text-muted-foreground">{satuan}</span>
        ) : null}
      </p>
      {keterangan ? (
        <p className="mt-auto pt-3 text-xs text-muted-foreground">{keterangan}</p>
      ) : null}
    </Card>
  );
}
