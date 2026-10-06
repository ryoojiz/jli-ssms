import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Kolom<T> = {
  judul: string;
  render: (row: T) => ReactNode;
  kanan?: boolean;
};

export function TabelData<T>({
  judul,
  deskripsi,
  kolom,
  data,
  aksi,
}: {
  judul: string;
  deskripsi?: string;
  kolom: Kolom<T>[];
  data: T[];
  aksi?: ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{judul}</h2>
          {deskripsi ? <p className="mt-0.5 text-xs text-muted-foreground">{deskripsi}</p> : null}
        </div>
        {aksi}
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {data.map((row, i) => (
          <div key={i} className="rounded-md border border-border bg-card p-3">
            <dl className="grid gap-2.5">
              {kolom.map((k) => (
                <div key={k.judul} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 text-xs">
                  <dt className="font-medium text-muted-foreground">{k.judul}</dt>
                  <dd className={k.kanan ? "min-w-0 text-right tabular-nums" : "min-w-0 text-right font-medium text-foreground"}>
                    {k.render(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60">
              {kolom.map((k) => (
                <TableHead key={k.judul} className={k.kanan ? "text-right" : undefined}>
                  {k.judul}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {kolom.map((k) => (
                  <TableCell key={k.judul} className={k.kanan ? "text-right tabular-nums" : undefined}>
                    {k.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
