import { useEffect, useState } from "react";
import { z } from "zod";

import { KELAS, MAPEL, SISWA } from "@/lib/demo-data";
import type { Sesi } from "@/lib/rbac";

const KEY = "jli-ssms.priority-demo.v1";
export const DEMO_SCHOOL_ID = "demo-sdn01";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) &&
      new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v,
  );
const stamp = z.string().refine((v) => Number.isFinite(Date.parse(v)));
const base = {
  id: z.string(),
  schoolId: z.literal(DEMO_SCHOOL_ID),
  createdAt: stamp,
  createdBy: z.string(),
};
const itemSchema = z.object({ ...base, name: z.string(), unit: z.string(), location: z.string() });
const movementSchema = z.object({
  ...base,
  itemId: z.string(),
  delta: z.number().int(),
  kind: z.enum(["Masuk", "Keluar", "Penyesuaian"]),
  note: z.string(),
  refId: z.string().optional(),
});
const requestSchema = z.object({
  ...base,
  itemId: z.string(),
  quantity: z.number().int().positive(),
  note: z.string(),
  status: z.enum(["Menunggu", "Disetujui", "Ditolak", "Diserahkan"]),
  reviewedAt: stamp.optional(),
  reviewedBy: z.string().optional(),
  handedAt: stamp.optional(),
  handedBy: z.string().optional(),
});
const countSchema = z.object({
  ...base,
  itemId: z.string(),
  expected: z.number().int().nonnegative(),
  observed: z.number().int().nonnegative(),
  reason: z.string(),
  status: z.enum(["Menunggu", "Disetujui", "Ditolak"]),
  reviewedAt: stamp.optional(),
  reviewedBy: z.string().optional(),
});
const bookingSchema = z.object({
  ...base,
  classId: z.string(),
  date,
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  purpose: z.string(),
  expected: z.number().int().positive(),
  actual: z.number().int().nonnegative().optional(),
  status: z.enum(["Menunggu", "Dikonfirmasi", "Ditolak", "Dibatalkan", "Selesai", "Tidak Hadir"]),
  reviewedAt: stamp.optional(),
  reviewedBy: z.string().optional(),
  completedAt: stamp.optional(),
  completedBy: z.string().optional(),
  canceledAt: stamp.optional(),
  canceledBy: z.string().optional(),
});
const editSchema = z.object({
  studentId: z.string(),
  value: z.number().min(0).max(100).nullable(),
  at: stamp,
  by: z.string(),
});
const assessmentSchema = z.object({
  ...base,
  teacherId: z.string(),
  classId: z.string(),
  subject: z.string(),
  semester: z.string(),
  kind: z.enum(["Harian", "PTS", "PAS"]),
  title: z.string(),
  deadline: date,
  publishedAt: stamp.optional(),
  scores: z.record(z.string(), z.number().min(0).max(100)),
  edits: z.array(editSchema),
});
const weightSchema = z.object({
  schoolId: z.literal(DEMO_SCHOOL_ID),
  classId: z.string(),
  subject: z.string(),
  semester: z.string(),
  daily: z.number().int().min(0).max(100),
  pts: z.number().int().min(0).max(100),
  pas: z.number().int().min(0).max(100),
  changedAt: stamp,
  changedBy: z.string(),
});
const noteSchema = z.object({
  ...base,
  teacherId: z.string(),
  semester: z.string(),
  text: z.string(),
});
const schema = z.object({
  version: z.literal(1),
  schoolId: z.literal(DEMO_SCHOOL_ID),
  items: z.array(itemSchema),
  movements: z.array(movementSchema),
  requests: z.array(requestSchema),
  counts: z.array(countSchema),
  roomCapacity: z.number().int().positive(),
  roomCapacityChangedAt: stamp.optional(),
  roomCapacityChangedBy: z.string().optional(),
  bookings: z.array(bookingSchema),
  assessments: z.array(assessmentSchema),
  weights: z.array(weightSchema),
  notes: z.array(noteSchema),
});

export type PriorityState = z.infer<typeof schema>;
export type StockItem = z.infer<typeof itemSchema>;
export type StockRequest = z.infer<typeof requestSchema>;
export type StockCount = z.infer<typeof countSchema>;
export type RoomBooking = z.infer<typeof bookingSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentKind = Assessment["kind"];

const EMPTY: PriorityState = {
  version: 1,
  schoolId: DEMO_SCHOOL_ID,
  items: [],
  movements: [],
  requests: [],
  counts: [],
  roomCapacity: 36,
  bookings: [],
  assessments: [],
  weights: [],
  notes: [],
};
let state: PriorityState = EMPTY;
const listeners = new Set<(next: PriorityState) => void>();
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const now = () => new Date().toISOString();
const owner = (actor: Sesi) => actor.email.toLowerCase();
const common = (actor: Sesi) => ({
  id: uid(),
  schoolId: DEMO_SCHOOL_ID as typeof DEMO_SCHOOL_ID,
  createdAt: now(),
  createdBy: owner(actor),
});
const fail = (message: string): never => {
  throw new Error(message);
};
const positive = (n: number) => Number.isSafeInteger(n) && n > 0;
const textOk = (v: string, max = 120) => Boolean(v.trim()) && v.trim().length <= max;
const validDate = (v: string) => date.safeParse(v).success;

function read(): PriorityState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? schema.parse(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}
function current() {
  state = read();
  return state;
}
function save(next: PriorityState) {
  if (typeof window === "undefined") fail("Data belum dapat disimpan. Coba lagi.");
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    fail("Data belum dapat disimpan. Coba lagi.");
  }
  state = next;
  listeners.forEach((listener) => listener(next));
}
export function usePriorityDemo() {
  const [snapshot, setSnapshot] = useState<PriorityState>(EMPTY);
  useEffect(() => {
    setSnapshot(current());
    listeners.add(setSnapshot);
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) {
        state = read();
        listeners.forEach((listener) => listener(state));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(setSnapshot);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return snapshot;
}
export function stockBalance(snapshot: PriorityState, itemId: string) {
  return snapshot.movements.filter((m) => m.itemId === itemId).reduce((sum, m) => sum + m.delta, 0);
}
const staff = (actor: Sesi) =>
  !["siswa", "walimurid", "auditor", "kepala_sekolah"].includes(actor.peran);

export function addStockItem(actor: Sesi, name: string, unit: string, location: string) {
  if (actor.peran !== "operator") fail("Hanya operator yang mengelola katalog gudang.");
  if (![name, unit, location].every((v) => textOk(v, 80)))
    fail("Isi nama, satuan, dan lokasi (maksimal 80 karakter).");
  const prev = current();
  if (
    prev.items.some(
      (i) =>
        i.name.toLowerCase() === name.trim().toLowerCase() &&
        i.location.toLowerCase() === location.trim().toLowerCase(),
    )
  )
    fail("Barang dan lokasi ini sudah tercatat.");
  save({
    ...prev,
    items: [
      { ...common(actor), name: name.trim(), unit: unit.trim(), location: location.trim() },
      ...prev.items,
    ],
  });
}
export function receiveStock(actor: Sesi, itemId: string, quantity: number, note: string) {
  if (!["operator", "sarpras"].includes(actor.peran))
    fail("Hanya operator atau sarpras yang mencatat barang masuk.");
  const prev = current();
  if (!prev.items.some((i) => i.id === itemId) || !positive(quantity) || !textOk(note, 300))
    fail("Pilih barang, jumlah, dan keterangan yang valid.");
  save({
    ...prev,
    movements: [
      { ...common(actor), itemId, delta: quantity, kind: "Masuk", note: note.trim() },
      ...prev.movements,
    ],
  });
}
export function requestStock(actor: Sesi, itemId: string, quantity: number, note: string) {
  if (!staff(actor)) fail("Akun ini tidak dapat meminta barang.");
  const prev = current();
  if (!prev.items.some((i) => i.id === itemId) || !positive(quantity) || !textOk(note, 300))
    fail("Permintaan barang tidak lengkap.");
  save({
    ...prev,
    requests: [
      { ...common(actor), itemId, quantity, note: note.trim(), status: "Menunggu" },
      ...prev.requests,
    ],
  });
}
export function reviewStockRequest(actor: Sesi, requestId: string, approve: boolean) {
  if (actor.peran !== "sarpras") fail("Hanya sarpras yang meninjau permintaan.");
  const prev = current();
  const request = prev.requests.find((r) => r.id === requestId);
  if (!request || request.status !== "Menunggu")
    fail("Permintaan tidak tersedia atau sudah ditinjau.");
  save({
    ...prev,
    requests: prev.requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: approve ? ("Disetujui" as const) : ("Ditolak" as const),
            reviewedAt: now(),
            reviewedBy: owner(actor),
          }
        : r,
    ),
  });
}
export function handOverStock(actor: Sesi, requestId: string) {
  if (actor.peran !== "sarpras") fail("Hanya sarpras yang menyerahkan barang.");
  const prev = current();
  const request = prev.requests.find((r) => r.id === requestId);
  if (!request) throw new Error("Permintaan tidak ditemukan.");
  if (request.status !== "Disetujui") fail("Permintaan belum disetujui atau sudah diserahkan.");
  if (stockBalance(prev, request.itemId) < request.quantity)
    fail("Stok tidak mencukupi saat penyerahan.");
  const timestamp = now();
  save({
    ...prev,
    requests: prev.requests.map((r) =>
      r.id === requestId
        ? { ...r, status: "Diserahkan" as const, handedAt: timestamp, handedBy: owner(actor) }
        : r,
    ),
    movements: [
      {
        ...common(actor),
        itemId: request.itemId,
        delta: -request.quantity,
        kind: "Keluar",
        note: request.note,
        refId: request.id,
      },
      ...prev.movements,
    ],
  });
}
export function submitStockCount(actor: Sesi, itemId: string, observed: number, reason: string) {
  if (actor.peran !== "sarpras") fail("Hanya sarpras yang mencatat opname.");
  const prev = current();
  if (
    !prev.items.some((i) => i.id === itemId) ||
    !Number.isSafeInteger(observed) ||
    observed < 0 ||
    !textOk(reason, 300)
  )
    fail("Hitungan fisik dan alasan harus valid.");
  if (prev.counts.some((c) => c.itemId === itemId && c.status === "Menunggu"))
    fail("Masih ada opname yang menunggu persetujuan.");
  save({
    ...prev,
    counts: [
      {
        ...common(actor),
        itemId,
        expected: stockBalance(prev, itemId),
        observed,
        reason: reason.trim(),
        status: "Menunggu",
      },
      ...prev.counts,
    ],
  });
}
export function reviewStockCount(actor: Sesi, countId: string, approve: boolean) {
  if (actor.peran !== "operator") fail("Hanya operator yang menyetujui penyesuaian stok.");
  const prev = current();
  const count = prev.counts.find((c) => c.id === countId);
  if (!count) throw new Error("Opname tidak ditemukan.");
  if (count.status !== "Menunggu") fail("Opname sudah ditinjau.");
  if (approve && stockBalance(prev, count.itemId) !== count.expected)
    fail("Stok berubah sejak opname; lakukan hitung ulang.");
  const delta = count.observed - count.expected;
  save({
    ...prev,
    counts: prev.counts.map((c) =>
      c.id === countId
        ? {
            ...c,
            status: approve ? ("Disetujui" as const) : ("Ditolak" as const),
            reviewedAt: now(),
            reviewedBy: owner(actor),
          }
        : c,
    ),
    movements:
      approve && delta !== 0
        ? [
            {
              ...common(actor),
              itemId: count.itemId,
              delta,
              kind: "Penyesuaian",
              note: count.reason,
              refId: count.id,
            },
            ...prev.movements,
          ]
        : prev.movements,
  });
}

export function canBookClass(actor: Sesi, classId: string) {
  if (actor.peran === "wali_kelas")
    return (
      actor.konteks
        ?.replace(/kelas\s*/i, "")
        .trim()
        .toLowerCase() === KELAS.find((k) => k.id === classId)?.nama.toLowerCase()
    );
  return actor.peran === "guru" && ["K4A", "K5A", "K6A"].includes(classId);
}
export function setRoomCapacity(actor: Sesi, capacity: number) {
  if (actor.peran !== "pustakawan" || !positive(capacity) || capacity > 200)
    fail("Hanya pustakawan dapat mengatur kapasitas 1–200 orang.");
  const prev = current();
  save({
    ...prev,
    roomCapacity: capacity,
    roomCapacityChangedAt: now(),
    roomCapacityChangedBy: owner(actor),
  });
}
export function createBooking(
  actor: Sesi,
  classId: string,
  day: string,
  start: string,
  end: string,
  purpose: string,
  expected: number,
) {
  const prev = current();
  if (!canBookClass(actor, classId)) fail("Anda tidak mengampu kelas yang dipilih.");
  if (
    !validDate(day) ||
    day < new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }) ||
    !/^\d{2}:\d{2}$/.test(start) ||
    !/^\d{2}:\d{2}$/.test(end) ||
    start >= end ||
    start < "06:00" ||
    end > "18:00" ||
    !textOk(purpose, 300) ||
    !positive(expected) ||
    expected > prev.roomCapacity
  )
    fail("Tanggal, jam, tujuan, atau jumlah peserta tidak valid.");
  save({
    ...prev,
    bookings: [
      {
        ...common(actor),
        classId,
        date: day,
        start,
        end,
        purpose: purpose.trim(),
        expected,
        status: "Menunggu",
      },
      ...prev.bookings,
    ],
  });
}
export function reviewBooking(actor: Sesi, bookingId: string, approve: boolean) {
  if (actor.peran !== "pustakawan") fail("Hanya pustakawan yang meninjau booking.");
  const prev = current();
  const booking = prev.bookings.find((b) => b.id === bookingId);
  if (!booking) throw new Error("Booking tidak ditemukan.");
  if (booking.status !== "Menunggu") fail("Booking sudah ditinjau.");
  if (
    approve &&
    prev.bookings.some(
      (b) =>
        b.id !== booking.id &&
        b.date === booking.date &&
        b.status === "Dikonfirmasi" &&
        b.start < booking.end &&
        booking.start < b.end,
    )
  )
    fail("Slot ruang perpustakaan bertabrakan.");
  save({
    ...prev,
    bookings: prev.bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            status: approve ? ("Dikonfirmasi" as const) : ("Ditolak" as const),
            reviewedAt: now(),
            reviewedBy: owner(actor),
          }
        : b,
    ),
  });
}
export function cancelBooking(actor: Sesi, bookingId: string) {
  const prev = current();
  const booking = prev.bookings.find((b) => b.id === bookingId);
  if (
    !booking ||
    !["Menunggu", "Dikonfirmasi"].includes(booking.status) ||
    (actor.peran !== "pustakawan" && booking.createdBy !== owner(actor))
  )
    fail("Booking tidak dapat dibatalkan.");
  save({
    ...prev,
    bookings: prev.bookings.map((b) =>
      b.id === bookingId
        ? { ...b, status: "Dibatalkan" as const, canceledAt: now(), canceledBy: owner(actor) }
        : b,
    ),
  });
}
export function completeBooking(actor: Sesi, bookingId: string, actual: number | null) {
  if (actor.peran !== "pustakawan") fail("Hanya pustakawan yang mencatat kunjungan.");
  const prev = current();
  const booking = prev.bookings.find((b) => b.id === bookingId);
  if (!booking) throw new Error("Booking tidak ditemukan.");
  if (
    booking.status !== "Dikonfirmasi" ||
    (actual !== null && (!Number.isSafeInteger(actual) || actual < 1 || actual > 200))
  )
    fail("Booking atau jumlah kunjungan tidak valid.");
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  if (booking.date > today || (booking.date === today && booking.end > localTime))
    fail("Kunjungan baru dapat dicatat setelah slot selesai.");
  save({
    ...prev,
    bookings: prev.bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            status: actual === null ? ("Tidak Hadir" as const) : ("Selesai" as const),
            actual: actual ?? undefined,
            completedAt: now(),
            completedBy: owner(actor),
          }
        : b,
    ),
  });
}

export function canAssess(actor: Sesi, classId: string, subject: string) {
  if (actor.guruId === "G06" && actor.peran === "wali_kelas")
    return (
      classId === "K5A" &&
      MAPEL.includes(subject) &&
      !["PJOK", "PAI & Budi Pekerti"].includes(subject)
    );
  if (actor.guruId === "G10" && actor.peran === "guru")
    return ["K4A", "K5A", "K6A"].includes(classId) && subject === "Bahasa Inggris";
  return false;
}
export function createAssessment(
  actor: Sesi,
  classId: string,
  subject: string,
  semester: string,
  kind: AssessmentKind,
  title: string,
  deadline: string,
) {
  if (!canAssess(actor, classId, subject)) fail("Anda tidak mengampu kelas dan mapel tersebut.");
  if (
    !textOk(title, 120) ||
    !textOk(semester, 30) ||
    !validDate(deadline) ||
    !["Harian", "PTS", "PAS"].includes(kind)
  )
    fail("Data penilaian tidak lengkap.");
  const prev = current();
  const assessment: Assessment = {
    ...common(actor),
    teacherId: actor.guruId!,
    classId,
    subject,
    semester: semester.trim(),
    kind,
    title: title.trim(),
    deadline,
    scores: {},
    edits: [],
  };
  save({ ...prev, assessments: [assessment, ...prev.assessments] });
  return assessment.id;
}
function ownAssessment(actor: Sesi, assessment: Assessment | undefined) {
  return Boolean(
    assessment &&
    actor.guruId === assessment.teacherId &&
    canAssess(actor, assessment.classId, assessment.subject),
  );
}
export function setAssessmentScore(
  actor: Sesi,
  assessmentId: string,
  studentId: string,
  value: number | null,
) {
  const prev = current();
  const assessment = prev.assessments.find((a) => a.id === assessmentId);
  if (!ownAssessment(actor, assessment)) fail("Anda tidak dapat mengubah penilaian ini.");
  if (
    !SISWA.some((s) => s.id === studentId && s.kelasId === assessment!.classId) ||
    (value !== null && (!Number.isFinite(value) || value < 0 || value > 100))
  )
    fail("Siswa atau nilai tidak valid.");
  if ((assessment!.scores[studentId] ?? null) === value) return;
  const scores = { ...assessment!.scores };
  if (value === null) delete scores[studentId];
  else scores[studentId] = value;
  save({
    ...prev,
    assessments: prev.assessments.map((a) =>
      a.id === assessmentId
        ? { ...a, scores, edits: [{ studentId, value, at: now(), by: owner(actor) }, ...a.edits] }
        : a,
    ),
  });
}
export function publishAssessment(actor: Sesi, assessmentId: string) {
  const prev = current();
  const assessment = prev.assessments.find((a) => a.id === assessmentId);
  if (!assessment) throw new Error("Penilaian tidak ditemukan.");
  if (!ownAssessment(actor, assessment) || assessment.publishedAt)
    fail("Penilaian tidak dapat dipublikasikan.");
  const students = SISWA.filter((s) => s.kelasId === assessment.classId);
  if (!students.length || students.some((s) => assessment.scores[s.id] === undefined))
    fail("Isi nilai seluruh siswa sebelum publikasi.");
  save({
    ...prev,
    assessments: prev.assessments.map((a) =>
      a.id === assessmentId ? { ...a, publishedAt: now() } : a,
    ),
  });
}
export function setGradeWeights(
  actor: Sesi,
  classId: string,
  subject: string,
  semester: string,
  daily: number,
  pts: number,
  pas: number,
) {
  if (actor.peran !== "operator") fail("Hanya operator yang mengatur bobot nilai.");
  if (
    !KELAS.some((k) => k.id === classId) ||
    !MAPEL.includes(subject) ||
    !textOk(semester, 30) ||
    [daily, pts, pas].some((n) => !Number.isInteger(n) || n < 0 || n > 100) ||
    daily + pts + pas !== 100
  )
    fail("Bobot Harian, PTS, dan PAS harus berjumlah 100%.");
  const prev = current();
  const weights = prev.weights.filter(
    (w) => !(w.classId === classId && w.subject === subject && w.semester === semester),
  );
  save({
    ...prev,
    weights: [
      {
        schoolId: DEMO_SCHOOL_ID,
        classId,
        subject,
        semester,
        daily,
        pts,
        pas,
        changedAt: now(),
        changedBy: owner(actor),
      },
      ...weights,
    ],
  });
}
export function studentGradeSummary(
  snapshot: PriorityState,
  studentId: string,
  subject: string,
  semester: string,
) {
  const student = SISWA.find((s) => s.id === studentId);
  const weights = snapshot.weights.find(
    (w) => w.classId === student?.kelasId && w.subject === subject && w.semester === semester,
  );
  const assessments = snapshot.assessments.filter(
    (a) =>
      a.classId === student?.kelasId &&
      a.subject === subject &&
      a.semester === semester &&
      a.publishedAt &&
      a.scores[studentId] !== undefined,
  );
  const avg = (kind: AssessmentKind) => {
    const values = assessments.filter((a) => a.kind === kind).map((a) => a.scores[studentId]!);
    return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
  };
  const daily = avg("Harian"),
    pts = avg("PTS"),
    pas = avg("PAS");
  const complete = Boolean(
    weights &&
    (weights.daily === 0 || daily !== null) &&
    (weights.pts === 0 || pts !== null) &&
    (weights.pas === 0 || pas !== null),
  );
  return {
    daily,
    pts,
    pas,
    final:
      complete && weights
        ? Math.round(
            ((daily ?? 0) * weights.daily + (pts ?? 0) * weights.pts + (pas ?? 0) * weights.pas) /
              100,
          )
        : null,
    weights,
  };
}
export function teacherKpi(snapshot: PriorityState, teacherId: string, semester: string) {
  const assessments = snapshot.assessments.filter(
    (a) => a.teacherId === teacherId && a.semester === semester,
  );
  const entriesTotal = assessments.reduce(
    (sum, a) => sum + SISWA.filter((s) => s.kelasId === a.classId).length,
    0,
  );
  const entriesDone = assessments.reduce(
    (sum, a) =>
      sum + SISWA.filter((s) => s.kelasId === a.classId && a.scores[s.id] !== undefined).length,
    0,
  );
  const deadlinePassed = assessments.filter(
    (a) => a.deadline <= new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }),
  );
  const onTime = deadlinePassed.filter(
    (a) => a.publishedAt && a.publishedAt <= `${a.deadline}T16:59:59.999Z`,
  ).length;
  return { entriesDone, entriesTotal, onTime, deadlineTotal: deadlinePassed.length };
}
export function addTeacherKpiNote(actor: Sesi, teacherId: string, semester: string, note: string) {
  if (actor.peran !== "kepala_sekolah") fail("Hanya kepala sekolah yang memberi catatan KPI.");
  if (!textOk(note, 1000) || !textOk(semester, 30)) fail("Isi catatan maksimal 1000 karakter.");
  const prev = current();
  save({
    ...prev,
    notes: [{ ...common(actor), teacherId, semester, text: note.trim() }, ...prev.notes],
  });
}
