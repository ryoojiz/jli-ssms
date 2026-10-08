import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { AKUN_DEMO } from "../src/lib/rbac";
import {
  announcementVisible,
  canManageAttendance,
  createLeaveRequest,
  markNotificationRead,
  publishAnnouncement,
  recordAttendance,
  reviewLeaveRequest,
} from "../src/lib/demo-workflow";
import type { DemoWorkflow } from "../src/lib/demo-workflow";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  value: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    },
  },
  configurable: true,
});

const KEY = "jli-ssms.demo-workflow.v1";
const parent = AKUN_DEMO.find((account) => account.peran === "walimurid")!;
const classTeacher = AKUN_DEMO.find((account) => account.peran === "wali_kelas")!;
const operator = AKUN_DEMO.find((account) => account.peran === "operator")!;
const subjectTeacher = AKUN_DEMO.find((account) => account.peran === "guru")!;

function saved(): DemoWorkflow {
  return JSON.parse(storage.get(KEY)!) as DemoWorkflow;
}

beforeEach(() => storage.clear());

test("parent request, class review, and local notification are linked and idempotent", () => {
  createLeaveRequest(parent, "Izin", "2026-10-08", "Kegiatan keluarga (uji)");
  assert.throws(() => createLeaveRequest(parent, "Izin", "2026-10-08", "Duplikat"));
  const request = saved().requests[0]!;
  assert.equal(request.status, "Menunggu");
  assert.equal(canManageAttendance(classTeacher, request.kelasId), true);
  assert.equal(canManageAttendance(classTeacher, "K4A"), false);
  assert.throws(() => reviewLeaveRequest(subjectTeacher, request.id, "Disetujui"));

  reviewLeaveRequest(classTeacher, request.id, "Disetujui");
  assert.equal(saved().requests[0]!.status, "Disetujui");
  assert.equal(saved().attendance[0]!.status, "Izin");
  assert.equal(saved().notifications.length, 1);
  assert.throws(() => reviewLeaveRequest(classTeacher, request.id, "Disetujui"));
  assert.equal(saved().notifications.length, 1);

  const notification = saved().notifications[0]!;
  markNotificationRead(parent, notification.id);
  markNotificationRead(parent, notification.id);
  assert.deepEqual(saved().readIds, [notification.id]);
});

test("operator correction persists and identical status does not generate another alert", () => {
  assert.throws(() => recordAttendance(subjectTeacher, parent.siswaId!, "2026-10-08", "Hadir"));
  recordAttendance(operator, parent.siswaId!, "2026-10-08", "Hadir");
  recordAttendance(operator, parent.siswaId!, "2026-10-08", "Hadir");
  assert.equal(saved().attendance.length, 1);
  assert.equal(saved().notifications.length, 1);
  recordAttendance(operator, parent.siswaId!, "2026-10-08", "Terlambat");
  assert.equal(saved().attendance[0]!.status, "Terlambat");
  assert.equal(saved().attendance[0]!.changedBy, operator.nama);
  assert.equal(saved().notifications.length, 2);
});

test("rejected request stays separate from attendance and alerts only its parent", () => {
  createLeaveRequest(parent, "Sakit", "2026-10-11", "Data uji");
  const request = saved().requests[0]!;
  assert.throws(() => reviewLeaveRequest(parent, request.id, "Ditolak"));
  reviewLeaveRequest(classTeacher, request.id, "Ditolak");
  assert.equal(saved().requests[0]!.status, "Ditolak");
  assert.equal(saved().attendance.length, 0);
  assert.equal(saved().notifications.length, 1);
  assert.equal(saved().notifications[0]!.siswaId, parent.siswaId);
});

test("only operator publishes and class targeting follows linked child", () => {
  assert.throws(() => publishAnnouncement(classTeacher, "Judul", "Isi", "Kelas 4-6"));
  publishAnnouncement(operator, "Judul", "Isi", "Kelas 4-6");
  assert.equal(saved().announcements.length, 1);
  assert.equal(announcementVisible("Kelas 4-6", parent), true);
  assert.equal(announcementVisible("Kelas 1-3", parent), false);
  assert.equal(announcementVisible("Guru", parent), false);
});

test("malformed stored JSON is ignored safely before a new action", () => {
  storage.set(KEY, "{broken-json");
  createLeaveRequest(parent, "Sakit", "2026-10-09", "Data uji");
  assert.equal(saved().version, 1);
  assert.equal(saved().requests.length, 1);
  const damaged = saved();
  damaged.requests[0]!.requestedAt = "not-a-time";
  storage.set(KEY, JSON.stringify(damaged));
  createLeaveRequest(parent, "Izin", "2026-10-10", "Data uji kedua");
  assert.equal(saved().requests.length, 1);
  assert.equal(saved().requests[0]!.date, "2026-10-10");
});
