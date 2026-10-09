import { useEffect, useState } from "react";
import { z } from "zod";

import type { Sesi } from "@/lib/rbac";
import { SISWA, type StatusHadir } from "@/lib/demo-data";

const STORAGE_KEY = "jli-ssms.demo-workflow.v1";
const SCHOOL_ID = "demo-sdn01";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (value: string) => {
  if (!DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const dateSchema = z.string().refine(validDate);
const timestampSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)));

const requestSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  siswaId: z.string(),
  kelasId: z.string(),
  kind: z.enum(["Izin", "Sakit"]),
  date: dateSchema,
  note: z.string(),
  status: z.enum(["Menunggu", "Disetujui", "Ditolak"]),
  requestedAt: timestampSchema,
  decidedAt: timestampSchema.optional(),
  decidedBy: z.string().optional(),
});
const attendanceSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  siswaId: z.string(),
  date: dateSchema,
  status: z.enum(["Hadir", "Terlambat", "Izin", "Sakit", "Alfa"]),
  changedAt: timestampSchema,
  changedBy: z.string(),
});
const announcementSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  title: z.string(),
  body: z.string(),
  target: z.enum(["Semua", "Orang Tua", "Guru", "Kelas 1-3", "Kelas 4-6"]),
  publishedAt: timestampSchema,
  author: z.string(),
});
const notificationSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  siswaId: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: timestampSchema,
  sourceKey: z.string(),
});
const stateSchema = z.object({
  version: z.literal(1),
  requests: z.array(requestSchema),
  attendance: z.array(attendanceSchema),
  announcements: z.array(announcementSchema),
  notifications: z.array(notificationSchema),
  readIds: z.array(z.string()),
});

export type LeaveRequest = z.infer<typeof requestSchema>;
export type AttendanceChange = z.infer<typeof attendanceSchema>;
export type DemoAnnouncement = z.infer<typeof announcementSchema>;
export type DemoNotification = z.infer<typeof notificationSchema>;
export type DemoWorkflow = z.infer<typeof stateSchema>;
export type AnnouncementTarget = DemoAnnouncement["target"];

const emptyState: DemoWorkflow = {
  version: 1,
  requests: [],
  attendance: [],
  announcements: [],
  notifications: [],
  readIds: [],
};
let state = emptyState;
const listeners = new Set<(next: DemoWorkflow) => void>();

function readStored(): DemoWorkflow {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? stateSchema.parse(JSON.parse(raw)) : emptyState;
  } catch {
    return emptyState;
  }
}

function emit(next: DemoWorkflow) {
  state = next;
  listeners.forEach((listener) => listener(next));
}

function write(next: DemoWorkflow) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit(next);
  } catch {
    throw new Error("Data belum dapat disimpan. Coba lagi.");
  }
}

function current() {
  state = readStored();
  return state;
}

function id() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function addNotification(existing: DemoNotification[], notification: DemoNotification) {
  return existing.some((item) => item.sourceKey === notification.sourceKey)
    ? existing
    : [notification, ...existing];
}

export function useDemoWorkflow() {
  const [snapshot, setSnapshot] = useState<DemoWorkflow>(emptyState);
  useEffect(() => {
    setSnapshot(current());
    listeners.add(setSnapshot);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) emit(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(setSnapshot);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return snapshot;
}

export function todayLocal() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatDemoDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function canManageAttendance(actor: Sesi | null | undefined, kelasId: string) {
  if (actor?.peran === "operator") return true;
  if (actor?.peran !== "wali_kelas") return false;
  if (actor.classId) return actor.classId === kelasId;
  const match = actor.konteks?.match(/Kelas\s+(\d+)([A-Z])/i);
  return match?.[1] && match[2] ? `K${match[1]}${match[2].toUpperCase()}` === kelasId : false;
}

export function createLeaveRequest(
  actor: Sesi,
  kind: "Izin" | "Sakit",
  date: string,
  note: string,
) {
  if (actor.peran !== "walimurid" || !actor.siswaId)
    throw new Error("Hanya wali murid terkait yang dapat mengajukan izin.");
  const student = SISWA.find((item) => item.id === actor.siswaId);
  if (!student || !validDate(date) || !note.trim() || note.trim().length > 500)
    throw new Error("Lengkapi tanggal dan alasan (maksimal 500 karakter).");
  const previous = current();
  if (
    previous.requests.some(
      (item) => item.siswaId === student.id && item.date === date && item.status === "Menunggu",
    )
  ) {
    throw new Error("Sudah ada pengajuan yang menunggu untuk tanggal ini.");
  }
  const request: LeaveRequest = {
    id: id(),
    schoolId: SCHOOL_ID,
    siswaId: student.id,
    kelasId: student.kelasId,
    kind,
    date,
    note: note.trim(),
    status: "Menunggu",
    requestedAt: new Date().toISOString(),
  };
  write({ ...previous, requests: [request, ...previous.requests] });
}

export function reviewLeaveRequest(
  actor: Sesi,
  requestId: string,
  decision: "Disetujui" | "Ditolak",
) {
  const previous = current();
  const request = previous.requests.find(
    (item) => item.id === requestId && item.schoolId === SCHOOL_ID,
  );
  if (!request || !canManageAttendance(actor, request.kelasId) || request.status !== "Menunggu") {
    throw new Error("Pengajuan tidak tersedia atau Anda tidak berwenang meninjaunya.");
  }
  const when = new Date().toISOString();
  const updated: LeaveRequest = {
    ...request,
    status: decision,
    decidedAt: when,
    decidedBy: actor.nama,
  };
  const attendance =
    decision === "Disetujui"
      ? [
          {
            id: id(),
            schoolId: SCHOOL_ID,
            siswaId: request.siswaId,
            date: request.date,
            status: request.kind,
            changedAt: when,
            changedBy: actor.nama,
          } satisfies AttendanceChange,
          ...previous.attendance.filter(
            (item) => !(item.siswaId === request.siswaId && item.date === request.date),
          ),
        ]
      : previous.attendance;
  const notification: DemoNotification = {
    id: id(),
    schoolId: SCHOOL_ID,
    siswaId: request.siswaId,
    title: `Pengajuan ${request.kind.toLowerCase()} ${decision.toLowerCase()}`,
    body: `Pengajuan untuk ${request.date} telah ${decision.toLowerCase()} oleh ${actor.nama}`,
    createdAt: when,
    sourceKey: `request:${request.id}:${decision}`,
  };
  write({
    ...previous,
    requests: previous.requests.map((item) => (item.id === requestId ? updated : item)),
    attendance,
    notifications: addNotification(previous.notifications, notification),
  });
}

export function recordAttendance(actor: Sesi, siswaId: string, date: string, status: StatusHadir) {
  const student = SISWA.find((item) => item.id === siswaId);
  if (!student || !canManageAttendance(actor, student.kelasId) || !validDate(date)) {
    throw new Error("Catatan tidak tersedia atau Anda tidak berwenang mengubahnya.");
  }
  const previous = current();
  if (
    previous.attendance.some(
      (item) => item.siswaId === siswaId && item.date === date && item.status === status,
    )
  )
    return;
  const when = new Date().toISOString();
  const change: AttendanceChange = {
    id: id(),
    schoolId: SCHOOL_ID,
    siswaId,
    date,
    status,
    changedAt: when,
    changedBy: actor.nama,
  };
  const notification: DemoNotification = {
    id: id(),
    schoolId: SCHOOL_ID,
    siswaId,
    title: "Kehadiran diperbarui",
    body: `Status kehadiran ${date}: ${status}. Dicatat oleh ${actor.nama}.`,
    createdAt: when,
    sourceKey: `attendance:${change.id}`,
  };
  write({
    ...previous,
    attendance: [
      change,
      ...previous.attendance.filter((item) => !(item.siswaId === siswaId && item.date === date)),
    ],
    notifications: addNotification(previous.notifications, notification),
  });
}

export function publishAnnouncement(
  actor: Sesi,
  title: string,
  body: string,
  target: AnnouncementTarget,
) {
  if (actor.peran !== "operator")
    throw new Error("Hanya operator yang dapat menerbitkan pengumuman.");
  if (
    !title.trim() ||
    !body.trim() ||
    title.trim().length > 120 ||
    body.trim().length > 2000 ||
    !announcementSchema.shape.target.safeParse(target).success
  ) {
    throw new Error("Isi judul dan pengumuman sesuai batas panjang yang ditentukan.");
  }
  const previous = current();
  const publishedAt = new Date().toISOString();
  const announcement: DemoAnnouncement = {
    id: id(),
    schoolId: SCHOOL_ID,
    title: title.trim(),
    body: body.trim(),
    target,
    publishedAt,
    author: actor.nama,
  };
  write({ ...previous, announcements: [announcement, ...previous.announcements] });
}

export function markNotificationRead(actor: Sesi, notificationId: string) {
  const previous = current();
  if (
    actor.peran !== "walimurid" ||
    !actor.siswaId ||
    !previous.notifications.some(
      (item) => item.id === notificationId && item.siswaId === actor.siswaId,
    )
  )
    return;
  if (previous.readIds.includes(notificationId)) return;
  write({ ...previous, readIds: [...previous.readIds, notificationId] });
}

export function announcementVisible(target: AnnouncementTarget, actor: Sesi) {
  if (actor.peran === "operator") return true;
  if (target === "Semua") return true;
  if (target === "Orang Tua") return actor.peran === "walimurid";
  if (target === "Guru") return actor.peran === "guru" || actor.peran === "wali_kelas";
  const student = SISWA.find((item) => item.id === actor.siswaId);
  const grade = Number(student?.kelasId.match(/^K(\d+)/)?.[1]);
  if (!Number.isFinite(grade)) return false;
  return target === "Kelas 1-3" ? grade >= 1 && grade <= 3 : grade >= 4 && grade <= 6;
}
