import { useState } from "react";
import { ExternalLink, Link2 } from "lucide-react";

import { StatusPill } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SISTEM_INTEGRASI, type SistemIntegrasi } from "@/lib/integrasi-data";

const NADA_STATUS = { Tersinkron: "baik", Tertunda: "peringatan", Gagal: "bahaya" } as const;

export function IntegrasiSistem() {
  const [pilih, setPilih] = useState<SistemIntegrasi | null>(null);
  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Link2 className="size-5 text-primary" aria-hidden /> Integrasi Sistem Pemprov DKI & Kemendikdasmen
          </h2>
          <p className="text-sm text-muted-foreground">
            Ringkasan dari 9 sistem sumber. Klik kartu untuk detail.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SISTEM_INTEGRASI.map((s) => (
          <button key={s.id} type="button" onClick={() => setPilih(s)} className="text-left">
            <Card className="h-full p-4 transition-colors hover:border-primary">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{s.nama}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.sumber}</p>
                </div>
                <StatusPill nada={NADA_STATUS[s.status]}>{s.status}</StatusPill>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{s.utama.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.utama.nilai}</p>
              <ul className="mt-3 space-y-1 text-xs">
                {s.indikator.slice(0, 2).map((i) => (
                  <li key={i.label} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{i.label}</span>
                    <span className="font-medium text-foreground">{i.nilai}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.7rem] text-muted-foreground">Sinkron: {s.sinkronTerakhir}</p>
            </Card>
          </button>
        ))}
      </div>

      <Dialog open={!!pilih} onOpenChange={(o) => !o && setPilih(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {pilih ? (
            <>
              <DialogHeader>
                <DialogTitle>{pilih.nama}</DialogTitle>
                <DialogDescription>
                  {pilih.kategori} · Sumber: {pilih.sumber} · Sinkron {pilih.sinkronTerakhir}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 sm:grid-cols-2">
                {pilih.indikator.map((i) => (
                  <div key={i.label} className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">{i.label}</p>
                    <div className="mt-1">
                      {i.nada ? (
                        <StatusPill nada={i.nada}>{i.nilai}</StatusPill>
                      ) : (
                        <p className="font-semibold text-foreground">{i.nilai}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {pilih.kolom.map((k) => (
                        <th key={k} className="px-3 py-2 text-left text-xs font-semibold">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pilih.baris.map((b, n) => (
                      <tr key={n} className="border-t border-border">
                        {b.map((c, j) => (
                          <td key={j} className="whitespace-nowrap px-3 py-2">{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <a
                href={pilih.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Buka {pilih.sumber} <ExternalLink className="size-3.5" />
              </a>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
