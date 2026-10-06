import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  nilai,
  satuan,
  keterangan,
  icon: Icon,
}: {
  label: string;
  nilai: ReactNode;
  satuan?: string;
  keterangan?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="gap-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
        {nilai}
        {satuan ? <span className="ml-1 text-base font-semibold text-muted-foreground">{satuan}</span> : null}
      </p>
      {keterangan ? <p className="mt-1 text-xs text-muted-foreground">{keterangan}</p> : null}
    </Card>
  );
}
