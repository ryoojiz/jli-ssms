import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { AKUN_DEMO } from "../src/lib/rbac";
import { SISWA } from "../src/lib/demo-data";
import {
  addStockItem,
  addTeacherKpiNote,
  completeBooking,
  createAssessment,
  createBooking,
  handOverStock,
  publishAssessment,
  receiveStock,
  requestStock,
  reviewBooking,
  reviewStockCount,
  reviewStockRequest,
  setAssessmentScore,
  setGradeWeights,
  stockBalance,
  studentGradeSummary,
  submitStockCount,
  teacherKpi,
  type PriorityState,
} from "../src/lib/priority-demo";

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
const KEY = "jli-ssms.priority-demo.v1";
const actor = (role: string) => AKUN_DEMO.find((a) => a.peran === role)!;
const operator = actor("operator"),
  sarpras = actor("sarpras"),
  guru = actor("guru"),
  wali = actor("wali_kelas"),
  pustakawan = actor("pustakawan"),
  head = actor("kepala_sekolah"),
  parent = actor("walimurid");
const saved = () => JSON.parse(storage.get(KEY)!) as PriorityState;
beforeEach(() => storage.clear());

test("warehouse request, approval, handover and stock count are separate audited steps", () => {
  addStockItem(operator, "Kertas A4", "rim", "Gudang");
  const item = saved().items[0]!;
  assert.throws(() => receiveStock(parent, item.id, 3, "Beli"));
  receiveStock(operator, item.id, 5, "Penerimaan awal");
  requestStock(guru, item.id, 3, "Kegiatan kelas");
  const req = saved().requests[0]!;
  assert.throws(() => reviewStockRequest(operator, req.id, true));
  reviewStockRequest(sarpras, req.id, true);
  assert.equal(stockBalance(saved(), item.id), 5);
  handOverStock(sarpras, req.id);
  assert.equal(stockBalance(saved(), item.id), 2);
  assert.throws(() => handOverStock(sarpras, req.id));
  requestStock(guru, item.id, 4, "Terlalu banyak");
  reviewStockRequest(sarpras, saved().requests[0]!.id, true);
  assert.throws(() => handOverStock(sarpras, saved().requests[0]!.id));
  submitStockCount(sarpras, item.id, 1, "Selisih fisik");
  const count = saved().counts[0]!;
  assert.equal(stockBalance(saved(), item.id), 2);
  reviewStockCount(operator, count.id, true);
  assert.equal(stockBalance(saved(), item.id), 1);
  assert.throws(() => reviewStockCount(operator, count.id, true));
});

test("stock count rejects stale balance and malformed browser data fails safely", () => {
  addStockItem(operator, "Spidol", "buah", "Gudang");
  const item = saved().items[0]!;
  submitStockCount(sarpras, item.id, 5, "Hitungan fisik");
  const count = saved().counts[0]!;
  receiveStock(operator, item.id, 1, "Masuk setelah hitung");
  assert.throws(() => reviewStockCount(operator, count.id, true));
  storage.set(KEY, "{not-json");
  addStockItem(operator, "Penghapus", "buah", "Gudang");
  assert.equal(saved().items.length, 1);
});

test("library booking confirmation blocks overlap and tracks completed or no-show visits", () => {
  createBooking(wali, "K5A", "2099-01-10", "09:00", "10:00", "Literasi", 20);
  createBooking(guru, "K5A", "2099-01-10", "09:30", "10:30", "Baca bersama", 15);
  const [second, first] = saved().bookings;
  assert.throws(() => reviewBooking(guru, first!.id, true));
  reviewBooking(pustakawan, first!.id, true);
  assert.throws(() => reviewBooking(pustakawan, second!.id, true));
  assert.throws(() => completeBooking(pustakawan, first!.id, 18));
  storage.set(
    KEY,
    JSON.stringify({
      ...saved(),
      bookings: saved().bookings.map((b) =>
        b.id === first!.id ? { ...b, date: "2026-01-01" } : b,
      ),
    }),
  );
  completeBooking(pustakawan, first!.id, 18);
  assert.equal(saved().bookings.find((b) => b.id === first!.id)?.actual, 18);
  reviewBooking(pustakawan, second!.id, true);
  storage.set(
    KEY,
    JSON.stringify({
      ...saved(),
      bookings: saved().bookings.map((b) =>
        b.id === second!.id ? { ...b, date: "2026-01-01" } : b,
      ),
    }),
  );
  completeBooking(pustakawan, second!.id, null);
  assert.equal(saved().bookings.find((b) => b.id === second!.id)?.status, "Tidak Hadir");
});

test("published scores reach linked parent summary, retain corrections and drive transparent KPI", () => {
  assert.throws(() =>
    createAssessment(
      guru,
      "K5A",
      "Matematika",
      "2026/2027 Ganjil",
      "Harian",
      "Bab 1",
      "2026-01-01",
    ),
  );
  const id = createAssessment(
    wali,
    "K5A",
    "Matematika",
    "2026/2027 Ganjil",
    "Harian",
    "Bab 1",
    "2026-01-01",
  );
  assert.throws(() =>
    setAssessmentScore(parent, id, SISWA.find((s) => s.kelasId === "K5A")!.id, 80),
  );
  assert.throws(() =>
    setAssessmentScore(wali, id, SISWA.find((s) => s.kelasId === "K5A")!.id, 101),
  );
  assert.throws(() => publishAssessment(wali, id));
  for (const student of SISWA.filter((s) => s.kelasId === "K5A"))
    setAssessmentScore(wali, id, student.id, 80);
  publishAssessment(wali, id);
  assert.throws(() => publishAssessment(wali, id));
  assert.throws(() => setGradeWeights(parent, "K5A", "Matematika", "2026/2027 Ganjil", 50, 25, 25));
  assert.throws(() =>
    setGradeWeights(operator, "K5A", "Matematika", "2026/2027 Ganjil", 50, 20, 20),
  );
  setGradeWeights(operator, "K5A", "Matematika", "2026/2027 Ganjil", 50, 25, 25);
  const child = parent.siswaId!;
  assert.equal(studentGradeSummary(saved(), child, "Matematika", "2026/2027 Ganjil").daily, 80);
  assert.equal(studentGradeSummary(saved(), child, "Matematika", "2026/2027 Ganjil").final, null);
  setAssessmentScore(wali, id, child, 90);
  assert.equal(saved().assessments[0]!.edits[0]!.value, 90);
  assert.equal(studentGradeSummary(saved(), child, "Matematika", "2026/2027 Ganjil").daily, 90);
  const kpi = teacherKpi(saved(), "G06", "2026/2027 Ganjil");
  assert.equal(kpi.entriesDone, kpi.entriesTotal);
  assert.equal(kpi.onTime, 0);
  assert.equal(kpi.deadlineTotal, 1);
  addTeacherKpiNote(head, "G06", "2026/2027 Ganjil", "Perlu tindak lanjut administrasi.");
  assert.equal(saved().notes.length, 1);
  assert.throws(() => addTeacherKpiNote(operator, "G06", "2026/2027 Ganjil", "Tidak boleh"));
});
