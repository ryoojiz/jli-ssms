import assert from "node:assert/strict";
import { test } from "node:test";

import { SISWA } from "../src/lib/demo-data";
import type { DemoWorkflow } from "../src/lib/demo-workflow";
import type { PriorityState } from "../src/lib/priority-demo";
import { summarizePriorityUsage } from "../src/lib/priority-usage";

const schoolId = "demo-sdn01" as const;
const createdAt = "2020-01-01T12:00:00.000Z";
const common = { schoolId, createdAt, createdBy: "demo@school.test" };

function empty(): [PriorityState, DemoWorkflow] {
  return [
    {
      version: 1,
      schoolId,
      items: [],
      movements: [],
      requests: [],
      counts: [],
      roomCapacity: 36,
      bookings: [],
      assessments: [],
      weights: [],
      notes: [],
    },
    { version: 1, requests: [], attendance: [], announcements: [], notifications: [], readIds: [] },
  ];
}

test("empty browser demo reports zero activity and no teacher denominator", () => {
  const [priority, workflow] = empty();
  assert.deepEqual(summarizePriorityUsage(priority, workflow), {
    warehouse: { handovers: 0, pending: 0, approvedCounts: 0 },
    attendance: { records: 0, pendingRequests: 0 },
    library: { visits: 0, visitors: 0, pending: 0 },
    grades: { published: 0, drafts: 0, publishedScores: 0 },
    teacher: { active: 0, entriesDone: 0, entriesTotal: 0, onTime: 0, deadlineTotal: 0 },
  });
});

test("usage counts only completed demo transactions and keeps teacher KPI denominators", () => {
  const [priority, workflow] = empty();
  const student = SISWA[0]!;
  const classSize = SISWA.filter((s) => s.kelasId === student.kelasId).length;
  priority.requests = [
    { ...common, id: "r1", itemId: "item", quantity: 2, note: "Kelas", status: "Diserahkan" },
    { ...common, id: "r2", itemId: "item", quantity: 1, note: "Kelas", status: "Menunggu" },
  ];
  priority.counts = [
    {
      ...common,
      id: "c1",
      itemId: "item",
      expected: 3,
      observed: 2,
      reason: "Selisih",
      status: "Disetujui",
    },
  ];
  priority.bookings = [
    {
      ...common,
      id: "b1",
      classId: student.kelasId,
      date: "2020-01-01",
      start: "09:00",
      end: "10:00",
      purpose: "Literasi",
      expected: 20,
      actual: 18,
      status: "Selesai",
    },
    {
      ...common,
      id: "b2",
      classId: student.kelasId,
      date: "2099-01-01",
      start: "09:00",
      end: "10:00",
      purpose: "Literasi",
      expected: 20,
      status: "Menunggu",
    },
    {
      ...common,
      id: "b3",
      classId: student.kelasId,
      date: "2020-01-01",
      start: "11:00",
      end: "12:00",
      purpose: "Literasi",
      expected: 20,
      status: "Tidak Hadir",
    },
  ];
  priority.assessments = [
    {
      ...common,
      id: "a1",
      teacherId: "g1",
      classId: student.kelasId,
      subject: "Matematika",
      semester: "2020/2021 Ganjil",
      kind: "Harian",
      title: "Kuis",
      deadline: "2020-01-01",
      publishedAt: createdAt,
      scores: { [student.id]: 85 },
      edits: [],
    },
    {
      ...common,
      id: "a2",
      teacherId: "g1",
      classId: student.kelasId,
      subject: "Matematika",
      semester: "2020/2021 Ganjil",
      kind: "PTS",
      title: "PTS",
      deadline: "2099-01-01",
      scores: {},
      edits: [],
    },
  ];
  workflow.attendance = [
    {
      id: "at1",
      schoolId,
      siswaId: student.id,
      date: "2020-01-01",
      status: "Hadir",
      changedAt: createdAt,
      changedBy: "demo@school.test",
    },
    {
      id: "at2",
      schoolId: "other-school",
      siswaId: student.id,
      date: "2020-01-02",
      status: "Hadir",
      changedAt: createdAt,
      changedBy: "demo@school.test",
    },
  ];
  workflow.requests = [
    {
      id: "leave1",
      schoolId,
      siswaId: student.id,
      kelasId: student.kelasId,
      kind: "Izin",
      date: "2020-01-01",
      note: "Urusan keluarga",
      status: "Menunggu",
      requestedAt: createdAt,
    },
  ];

  assert.deepEqual(summarizePriorityUsage(priority, workflow), {
    warehouse: { handovers: 1, pending: 1, approvedCounts: 1 },
    attendance: { records: 1, pendingRequests: 1 },
    library: { visits: 1, visitors: 18, pending: 1 },
    grades: { published: 1, drafts: 1, publishedScores: 1 },
    teacher: {
      active: 1,
      entriesDone: 1,
      entriesTotal: classSize * 2,
      onTime: 1,
      deadlineTotal: 1,
    },
  });
});
