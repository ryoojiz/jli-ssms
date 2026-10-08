import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { KELAS, MAPEL, SISWA } from "@/lib/demo-data";
import {
  canAssess,
  createAssessment,
  publishAssessment,
  setAssessmentScore,
  setGradeWeights,
  studentGradeSummary,
  usePriorityDemo,
  type AssessmentKind,
} from "@/lib/priority-demo";

const DEFAULT_SEMESTER = "2026/2027 Ganjil";
const run = (action: () => void, message: string) => {
  try {
    action();
    toast.success(message);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Perubahan nilai gagal.");
  }
};

export function GradebookDemo() {
  const { sesi } = useAuth();
  const state = usePriorityDemo();
  const [semester, setSemester] = useState(DEFAULT_SEMESTER);
  const [classId, setClassId] = useState("K5A");
  const [subject, setSubject] = useState("Bahasa Indonesia");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<AssessmentKind>("Harian");
  const [deadline, setDeadline] = useState("");
  const [daily, setDaily] = useState("");
  const [pts, setPts] = useState("");
  const [pas, setPas] = useState("");
  if (!sesi) return null;
  const parent = ["walimurid", "siswa"].includes(sesi.peran);
  const student = SISWA.find((s) => s.id === sesi.siswaId);
  const visibleClass = parent ? (student?.kelasId ?? classId) : classId;
  const teachable = KELAS.flatMap((k) =>
    MAPEL.filter((m) => canAssess(sesi, k.id, m)).map((m) => ({ classId: k.id, subject: m })),
  );
  const activeClass = teachable.some((x) => x.classId === classId && x.subject === subject)
    ? classId
    : (teachable[0]?.classId ?? classId);
  const activeSubject = teachable.some((x) => x.classId === classId && x.subject === subject)
    ? subject
    : (teachable[0]?.subject ?? subject);
  const assessments = state.assessments.filter(
    (a) =>
      a.semester === semester &&
      (parent
        ? a.classId === visibleClass && Boolean(a.publishedAt)
        : a.classId === visibleClass) &&
      (!sesi.guruId ||
        a.teacherId === sesi.guruId ||
        ["operator", "kepala_sekolah", "auditor"].includes(sesi.peran)),
  );
  const weights = state.weights.find(
    (w) => w.classId === visibleClass && w.subject === subject && w.semester === semester,
  );

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-semibold">Nilai harian, PTS, dan PAS</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nilai akhir dihitung dari penilaian yang diterbitkan dan bobot yang lengkap. Orang tua
          dan siswa hanya melihat penilaian yang dipublikasikan.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <div>
            <Label htmlFor="grade-semester">Semester</Label>
            <Input
              id="grade-semester"
              className="w-44"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
          </div>
          {!parent && (
            <div>
              <Label htmlFor="grade-class">Kelas</Label>
              <select
                id="grade-class"
                className="h-9 min-w-32 rounded-md border bg-background px-3 text-sm"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                {KELAS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="grade-subject">Mapel</Label>
            <select
              id="grade-subject"
              className="h-9 min-w-36 rounded-md border bg-background px-3 text-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {MAPEL.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {sesi.peran === "operator" && (
        <Card className="p-5">
          <h2 className="font-semibold">
            Bobot nilai · {visibleClass} · {subject}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Total harus 100%. Tanpa bobot atau komponen yang lengkap, nilai akhir tetap “belum
            lengkap”.
          </p>
          <p className="mt-2 text-sm">
            Saat ini:{" "}
            {weights
              ? `Harian ${weights.daily}% · PTS ${weights.pts}% · PAS ${weights.pas}%`
              : "belum diatur"}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="weight-daily">Harian %</Label>
              <Input
                id="weight-daily"
                type="number"
                min="0"
                max="100"
                className="w-24"
                value={daily}
                onChange={(e) => setDaily(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="weight-pts">PTS %</Label>
              <Input
                id="weight-pts"
                type="number"
                min="0"
                max="100"
                className="w-24"
                value={pts}
                onChange={(e) => setPts(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="weight-pas">PAS %</Label>
              <Input
                id="weight-pas"
                type="number"
                min="0"
                max="100"
                className="w-24"
                value={pas}
                onChange={(e) => setPas(e.target.value)}
              />
            </div>
            <Button
              onClick={() =>
                run(
                  () =>
                    setGradeWeights(
                      sesi,
                      visibleClass,
                      subject,
                      semester,
                      Number(daily),
                      Number(pts),
                      Number(pas),
                    ),
                  "Bobot nilai disimpan.",
                )
              }
            >
              Simpan bobot
            </Button>
          </div>
        </Card>
      )}

      {teachable.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold">Buat penilaian</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Guru hanya dapat menilai kelas dan mapel yang diampu. Setelah dibuat, isi nilai
            seluruh siswa sebelum publikasi.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="new-assignment">Kelas dan mapel ampuan</Label>
              <select
                id="new-assignment"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={`${activeClass}|${activeSubject}`}
                onChange={(e) => {
                  const [c, m] = e.target.value.split("|");
                  setClassId(c!);
                  setSubject(m!);
                }}
              >
                {teachable.map((x) => (
                  <option key={`${x.classId}|${x.subject}`} value={`${x.classId}|${x.subject}`}>
                    {KELAS.find((k) => k.id === x.classId)?.nama} · {x.subject}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="assessment-title">Judul</Label>
              <Input
                id="assessment-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mis. Ulangan Bab 1"
              />
            </div>
            <div>
              <Label htmlFor="assessment-kind">Jenis</Label>
              <select
                id="assessment-kind"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={kind}
                onChange={(e) => setKind(e.target.value as AssessmentKind)}
              >
                <option>Harian</option>
                <option>PTS</option>
                <option>PAS</option>
              </select>
            </div>
            <div>
              <Label htmlFor="assessment-deadline">Tenggat publikasi</Label>
              <Input
                id="assessment-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-3"
            onClick={() =>
              run(() => {
                createAssessment(sesi, activeClass, activeSubject, semester, kind, title, deadline);
                setTitle("");
              }, "Penilaian dibuat sebagai draft.")
            }
          >
            Buat draft
          </Button>
        </Card>
      )}

      {parent && student && (
        <Card className="p-5">
          <h2 className="font-semibold">
            Ringkasan nilai {student.nama} · {subject}
          </h2>
          {(() => {
            const s = studentGradeSummary(state, student.id, subject, semester);
            return (
              <p className="mt-2 text-sm">
                Harian: {s.daily === null ? "—" : s.daily.toFixed(1)} · PTS:{" "}
                {s.pts === null ? "—" : s.pts.toFixed(1)} · PAS:{" "}
                {s.pas === null ? "—" : s.pas.toFixed(1)} ·{" "}
                <b>Nilai gabungan: {s.final ?? "belum lengkap"}</b>
              </p>
            );
          })()}
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-semibold">Daftar penilaian</h2>
        {assessments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada penilaian yang{" "}
            {parent ? "dipublikasikan untuk anak ini" : "sesuai filter"}.
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {assessments.map((a) => {
              const students = SISWA.filter(
                (s) => s.kelasId === a.classId && (!parent || s.id === sesi.siswaId),
              );
              const editable = Boolean(
                sesi.guruId === a.teacherId && canAssess(sesi, a.classId, a.subject),
              );
              return (
                <section key={a.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <b>{a.title}</b>
                      <p className="text-sm text-muted-foreground">
                        {a.classId} · {a.subject} · {a.kind} · tenggat {a.deadline} ·{" "}
                        {a.publishedAt ? `Terbit ${a.publishedAt.slice(0, 10)}` : "Draft"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Guru ID {a.teacherId} · {Object.keys(a.scores).length}/
                        {SISWA.filter((s) => s.kelasId === a.classId).length} nilai terisi
                      </p>
                    </div>
                    {editable && !a.publishedAt && (
                      <Button
                        size="sm"
                        onClick={() =>
                          run(
                            () => publishAssessment(sesi, a.id),
                            "Nilai dipublikasikan untuk siswa dan orang tua.",
                          )
                        }
                      >
                        Publikasikan
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 max-h-72 overflow-auto">
                    <table className="w-full min-w-80 text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Siswa</th>
                          <th className="p-2">Nilai</th>
                          <th className="p-2">Riwayat koreksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b">
                            <td className="p-2">{student.nama}</td>
                            <td className="p-2">
                              {editable ? (
                                <Input
                                  key={`${a.id}:${student.id}:${a.scores[student.id] ?? ""}`}
                                  className="w-24"
                                  type="number"
                                  min="0"
                                  max="100"
                                  defaultValue={a.scores[student.id] ?? ""}
                                  aria-label={`Nilai ${student.nama}`}
                                  onBlur={(e) => {
                                    const raw = e.target.value.trim();
                                    run(
                                      () =>
                                        setAssessmentScore(
                                          sesi,
                                          a.id,
                                          student.id,
                                          raw === "" ? null : Number(raw),
                                        ),
                                      "Nilai tersimpan.",
                                    );
                                  }}
                                />
                              ) : (
                                (a.scores[student.id] ?? "—")
                              )}
                            </td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {a.edits.find((e) => e.studentId === student.id)?.by ?? "—"}
                              {a.edits.find((e) => e.studentId === student.id)?.at
                                ? ` · ${a.edits
                                    .find((e) => e.studentId === student.id)!
                                    .at.slice(0, 16)
                                    .replace("T", " ")}`
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {a.publishedAt && editable && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Perubahan setelah publikasi langsung terlihat oleh orang tua dan tersimpan
                      dalam riwayat koreksi.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
