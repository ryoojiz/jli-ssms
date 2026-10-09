import { useEffect, useState } from "react";
import {
  getWorkflowSnapshot,
  mutateWorkflow,
  type WorkflowAction,
} from "@/lib/workflow-mysql.functions";
import type { Sesi } from "@/lib/rbac";
import type { AnnouncementTarget } from "@/lib/demo-workflow";

export { todayLocal, formatDemoDateTime, canManageAttendance } from "@/lib/demo-workflow";
export type { DemoWorkflow, AnnouncementTarget } from "@/lib/demo-workflow";

type WorkflowState = Awaited<ReturnType<typeof getWorkflowSnapshot>>;
const EMPTY: WorkflowState = {
  version: 1,
  requests: [],
  attendance: [],
  announcements: [],
  notifications: [],
  readIds: [],
  classes: [],
  students: [],
  sampleAttendance: [],
  historicLeave: [],
  trends: [],
  outbound: [],
};
let snapshot: WorkflowState = EMPTY;
const listeners = new Set<(value: WorkflowState) => void>();
let pending: Promise<void> | null = null;
let epoch = 0;

export function resetWorkflowSnapshot() {
  epoch += 1;
  snapshot = EMPTY;
  pending = null;
  listeners.forEach((listener) => listener(snapshot));
}

export async function refreshWorkflow() {
  if (pending) return pending;
  const currentEpoch = epoch;
  pending = getWorkflowSnapshot()
    .then((value) => {
      if (currentEpoch !== epoch) return;
      snapshot = value;
      listeners.forEach((listener) => listener(snapshot));
    })
    .finally(() => {
      if (currentEpoch === epoch) pending = null;
    });
  return pending;
}

export function useDemoWorkflow() {
  const [value, setValue] = useState(snapshot);
  useEffect(() => {
    listeners.add(setValue);
    void refreshWorkflow().catch((error) =>
      console.error("Data kehadiran dan komunikasi tidak dapat dibaca dari MySQL.", error),
    );
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
}

async function action(name: WorkflowAction, data: Record<string, unknown>) {
  await mutateWorkflow({ data: { key: crypto.randomUUID(), action: name, data } });
  await refreshWorkflow();
}

// Actor remains a UI convenience only; the server derives identity from its session cookie.
export const createLeaveRequest = (
  _actor: Sesi,
  kind: "Izin" | "Sakit",
  date: string,
  note: string,
) => action("createLeaveRequest", { kind, date, note });
export const reviewLeaveRequest = (
  _actor: Sesi,
  requestId: string,
  decision: "Disetujui" | "Ditolak",
) => action("reviewLeaveRequest", { requestId, decision });
export const recordAttendance = (
  _actor: Sesi,
  studentId: string,
  date: string,
  status: "Hadir" | "Terlambat" | "Izin" | "Sakit" | "Alfa",
) => action("recordAttendance", { studentId, date, status });
export const publishAnnouncement = (
  _actor: Sesi,
  title: string,
  body: string,
  target: AnnouncementTarget,
) => action("publishAnnouncement", { title, body, target });
export const markNotificationRead = (_actor: Sesi, notificationId: string) =>
  action("markNotificationRead", { notificationId });
export const announcementVisible = (_target: AnnouncementTarget, _actor: Sesi) => true;
