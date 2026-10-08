import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { GURU } from "@/lib/demo-data";
import { addTeacherKpiNote, teacherKpi, usePriorityDemo } from "@/lib/priority-demo";

const pct = (done: number, total: number) =>
  total === 0 ? "Belum cukup data" : `${Math.round((done / total) * 100)}% (${done}/${total})`;

export function TeacherKpiDemo() {
  const { sesi } = useAuth();
  const state = usePriorityDemo();
  const [semester, setSemester] = useState("2026/2027 Ganjil");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  if (!sesi || !["kepala_sekolah", "operator", "auditor"].includes(sesi.peran)) return null;
  return (
    <Card className="mt-6 p-5">
      <h2 className="font-semibold">KPI administrasi penilaian guru</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Dua indikator proses: kelengkapan nilai siswa dan publikasi sebelum tenggat. Kehadiran
        maupun hasil nilai murid tidak menjadi skor guru.
      </p>
      <div className="mt-3 max-w-xs">
        <Label htmlFor="kpi-semester">Semester</Label>
        <Input id="kpi-semester" value={semester} onChange={(e) => setSemester(e.target.value)} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {GURU.map((guru) => {
          const k = teacherKpi(state, guru.id, semester);
          const notes = state.notes.filter(
            (n) => n.teacherId === guru.id && n.semester === semester,
          );
          return (
            <div key={guru.id} className="rounded-md border p-4 text-sm">
              <b>{guru.nama}</b>
              <p className="text-muted-foreground">
                {guru.mapel} · {guru.id}
              </p>
              <div className="mt-3 space-y-1">
                <p>
                  Kelengkapan nilai siswa: <b>{pct(k.entriesDone, k.entriesTotal)}</b>
                </p>
                <p>
                  Publikasi sebelum tenggat: <b>{pct(k.onTime, k.deadlineTotal)}</b>
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Sumber: penilaian yang dibuat guru ini pada {semester}. Tenggat yang belum
                lewat tidak masuk indikator ketepatan waktu.
              </p>
              {notes.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  <b>Catatan kepala sekolah</b>
                  {notes.map((n) => (
                    <p key={n.id} className="mt-1 text-xs">
                      {n.text} · {n.createdAt.slice(0, 10)}
                    </p>
                  ))}
                </div>
              )}
              {sesi.peran === "kepala_sekolah" && (
                <div className="mt-3 flex gap-2">
                  <Input
                    aria-label={`Catatan untuk ${guru.nama}`}
                    value={drafts[guru.id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [guru.id]: e.target.value }))}
                    placeholder="Catatan internal (bukan pengesahan)"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      try {
                        addTeacherKpiNote(sesi, guru.id, semester, drafts[guru.id] ?? "");
                        setDrafts((d) => ({ ...d, [guru.id]: "" }));
                        toast.success("Catatan tersimpan.");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Gagal menyimpan.");
                      }
                    }}
                  >
                    Catat
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
