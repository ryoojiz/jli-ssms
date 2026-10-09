import { useEffect, useState } from "react";
import {
  getPrioritySnapshot,
  mutatePriority,
  type PriorityAction,
} from "@/lib/priority-mysql.functions";
import type { Sesi } from "@/lib/rbac";
import type { PriorityState, AssessmentKind } from "@/lib/priority-demo";

export { stockBalance, studentGradeSummary, teacherKpi } from "@/lib/priority-demo";
export type { PriorityState, AssessmentKind } from "@/lib/priority-demo";

const EMPTY: PriorityState = {
  version: 1,
  schoolId: "",
  items: [],
  movements: [],
  requests: [],
  counts: [],
  roomCapacity: 0,
  bookings: [],
  assessments: [],
  weights: [],
  notes: [],
};
let snapshot: PriorityState = EMPTY;
const listeners = new Set<(value: PriorityState) => void>();
let pending: Promise<void> | null = null;
let epoch = 0;

export function resetPrioritySnapshot() {
  epoch += 1;
  snapshot = EMPTY;
  pending = null;
  listeners.forEach((listener) => listener(snapshot));
}

export async function refreshPriority() {
  if (pending) return pending;
  const currentEpoch = epoch;
  pending = getPrioritySnapshot()
    .then((value) => {
      if (currentEpoch !== epoch) return;
      snapshot = value as PriorityState;
      listeners.forEach((listener) => listener(snapshot));
    })
    .finally(() => {
      if (currentEpoch === epoch) pending = null;
    });
  return pending;
}

export function usePriorityDemo() {
  const [value, setValue] = useState(snapshot);
  useEffect(() => {
    listeners.add(setValue);
    void refreshPriority().catch((error) => {
      console.error("Data operasional tidak dapat dibaca dari MySQL.", error);
    });
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
}

export function canBookClass(actor: Sesi, classId: string) {
  if (!actor.guruId || !["guru", "wali_kelas"].includes(actor.peran)) return false;
  return (
    snapshot.classes?.some((c) => c.id === classId && c.homeroomTeacherId === actor.guruId) ||
    snapshot.teacherAssignments?.some(
      (a) => a.teacherId === actor.guruId && a.classId === classId,
    ) ||
    false
  );
}

export function canAssess(actor: Sesi, classId: string, subject: string) {
  if (!actor.guruId || !["guru", "wali_kelas"].includes(actor.peran)) return false;
  return (
    snapshot.teacherAssignments?.some(
      (a) => a.teacherId === actor.guruId && a.classId === classId && a.subject === subject,
    ) ?? false
  );
}

async function action(name: PriorityAction, data: Record<string, unknown>) {
  await mutatePriority({ data: { key: crypto.randomUUID(), action: name, data } });
  await refreshPriority();
}

export const addStockItem = (_actor: Sesi, name: string, unit: string, location: string) =>
  action("addStockItem", { name, unit, location });
export const receiveStock = (_actor: Sesi, itemId: string, quantity: number, note: string) =>
  action("receiveStock", { itemId, quantity, note });
export const requestStock = (_actor: Sesi, itemId: string, quantity: number, note: string) =>
  action("requestStock", { itemId, quantity, note });
export const reviewStockRequest = (_actor: Sesi, requestId: string, approve: boolean) =>
  action("reviewStockRequest", { requestId, approve });
export const handOverStock = (_actor: Sesi, requestId: string) =>
  action("handOverStock", { requestId });
export const submitStockCount = (_actor: Sesi, itemId: string, observed: number, reason: string) =>
  action("submitStockCount", { itemId, observed, reason });
export const reviewStockCount = (_actor: Sesi, countId: string, approve: boolean) =>
  action("reviewStockCount", { countId, approve });
export const setRoomCapacity = (_actor: Sesi, capacity: number) =>
  action("setRoomCapacity", { capacity });
export const createBooking = (
  _actor: Sesi,
  classId: string,
  day: string,
  start: string,
  end: string,
  purpose: string,
  expected: number,
) => action("createBooking", { classId, day, start, end, purpose, expected });
export const reviewBooking = (_actor: Sesi, bookingId: string, approve: boolean) =>
  action("reviewBooking", { bookingId, approve });
export const cancelBooking = (_actor: Sesi, bookingId: string) =>
  action("cancelBooking", { bookingId });
export const completeBooking = (_actor: Sesi, bookingId: string, actual: number | null) =>
  action("completeBooking", { bookingId, actual });
export const createAssessment = (
  _actor: Sesi,
  classId: string,
  subject: string,
  semester: string,
  kind: AssessmentKind,
  title: string,
  deadline: string,
) => action("createAssessment", { classId, subject, semester, kind, title, deadline });
export const setAssessmentScore = (
  _actor: Sesi,
  assessmentId: string,
  studentId: string,
  value: number | null,
) => action("setAssessmentScore", { assessmentId, studentId, value });
export const publishAssessment = (_actor: Sesi, assessmentId: string) =>
  action("publishAssessment", { assessmentId });
export const setGradeWeights = (
  _actor: Sesi,
  classId: string,
  subject: string,
  semester: string,
  daily: number,
  pts: number,
  pas: number,
) => action("setGradeWeights", { classId, subject, semester, daily, pts, pas });
export const addTeacherKpiNote = (
  _actor: Sesi,
  teacherId: string,
  semester: string,
  note: string,
) => action("addTeacherKpiNote", { teacherId, semester, note });
