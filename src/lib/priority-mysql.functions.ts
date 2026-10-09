import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

const commandSchema = z.object({
  key: z.uuid(),
  action: z.enum([
    "addStockItem",
    "receiveStock",
    "requestStock",
    "reviewStockRequest",
    "handOverStock",
    "submitStockCount",
    "reviewStockCount",
    "setRoomCapacity",
    "createBooking",
    "reviewBooking",
    "cancelBooking",
    "completeBooking",
    "createAssessment",
    "setAssessmentScore",
    "publishAssessment",
    "setGradeWeights",
    "addTeacherKpiNote",
  ]),
  data: z.record(z.string(), z.unknown()),
});
export type PriorityAction = z.infer<typeof commandSchema>["action"];

export const getPrioritySnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const { requireIdentity } = await import("@/db/auth.server");
  const { mysqlPool } = await import("@/db/mysql.server");
  const { sesi, userId } = await requireIdentity();
  const sid = sesi.schoolId!;
  const db = mysqlPool();
  const read = async (sql: string, params: Array<string | number> = []) =>
    (await db.execute<RowDataPacket[]>(sql, params))[0];
  const own = (createdBy: string) => createdBy === sesi.email.toLowerCase();
  const admin = ["operator", "sarpras", "kepala_sekolah", "auditor"].includes(sesi.peran);
  const gradeAdmin = ["operator", "kepala_sekolah", "auditor"].includes(sesi.peran);
  const stockVisible = [
    "operator",
    "sarpras",
    "bendahara",
    "kepala_sekolah",
    "auditor",
    "guru",
    "wali_kelas",
  ].includes(sesi.peran);
  const rows = stockVisible
    ? await Promise.all([
        read("SELECT * FROM stock_items WHERE school_id=? ORDER BY created_at DESC", [sid]),
        read("SELECT * FROM stock_movements WHERE school_id=? ORDER BY created_at DESC", [sid]),
        read("SELECT * FROM stock_requests WHERE school_id=? ORDER BY created_at DESC", [sid]),
        read("SELECT * FROM stock_counts WHERE school_id=? ORDER BY created_at DESC", [sid]),
      ])
    : [[], [], [], []];
  const [items, movements, requests, counts] = rows;
  const rooms = await read("SELECT * FROM library_rooms WHERE school_id=? ORDER BY id LIMIT 1", [
    sid,
  ]);
  const bookings = [
    "guru",
    "wali_kelas",
    "pustakawan",
    "operator",
    "kepala_sekolah",
    "auditor",
  ].includes(sesi.peran)
    ? await read("SELECT * FROM room_bookings WHERE school_id=? ORDER BY created_at DESC", [sid])
    : [];
  let childClassId: string | null = null;
  if (["walimurid", "siswa"].includes(sesi.peran)) {
    if (!sesi.siswaId) throw new Error("Akun belum ditautkan ke siswa.");
    const child =
      sesi.peran === "walimurid"
        ? await read(
            `SELECT s.class_id FROM parent_student_links l JOIN students s
          ON s.school_id=l.school_id AND s.id=l.student_id
          WHERE l.school_id=? AND l.user_id=? AND l.student_id=?`,
            [sid, userId, sesi.siswaId],
          )
        : await read("SELECT class_id FROM students WHERE school_id=? AND id=?", [
            sid,
            sesi.siswaId,
          ]);
    childClassId = child[0]?.["class_id"] ? String(child[0]["class_id"]) : null;
    if (!childClassId) throw new Error("Hubungan siswa tidak ditemukan.");
  }
  const assessments = await read(
    "SELECT * FROM grade_assessments WHERE school_id=? ORDER BY created_at DESC",
    [sid],
  );
  const visibleAssessments = assessments.filter(
    (a) =>
      gradeAdmin ||
      (sesi.guruId && a["teacher_id"] === sesi.guruId) ||
      (childClassId && a["published_at"] && a["class_id"] === childClassId),
  );
  const scores = visibleAssessments.length
    ? await read("SELECT * FROM grade_scores WHERE school_id=?", [sid])
    : [];
  const edits =
    gradeAdmin || sesi.guruId
      ? await read("SELECT * FROM grade_score_edits WHERE school_id=? ORDER BY changed_at DESC", [
          sid,
        ])
      : [];
  const weights = await read("SELECT * FROM grade_weights WHERE school_id=?", [sid]);
  const notes = ["kepala_sekolah", "operator", "auditor"].includes(sesi.peran)
    ? await read("SELECT * FROM teacher_kpi_notes WHERE school_id=? ORDER BY created_at DESC", [
        sid,
      ])
    : [];
  const studentCounts = gradeAdmin
    ? await read(
        "SELECT class_id,COUNT(*) AS n FROM students WHERE school_id=? GROUP BY class_id",
        [sid],
      )
    : [];
  const classes = await read(
    "SELECT id,name,grade,homeroom_teacher_id FROM classes WHERE school_id=? ORDER BY grade,name",
    [sid],
  );
  const subjects = await read("SELECT name FROM subjects WHERE school_id=? ORDER BY name", [sid]);
  const teachers = gradeAdmin
    ? await read("SELECT id,name,subject FROM teachers WHERE school_id=? ORDER BY name", [sid])
    : [];
  const teacherAssignments = sesi.guruId
    ? await read(
        "SELECT teacher_id,class_id,subject_id FROM teacher_assignments WHERE school_id=? AND teacher_id=?",
        [sid, sesi.guruId],
      )
    : [];
  const visibleStudents = gradeAdmin
    ? await read("SELECT id,name,class_id FROM students WHERE school_id=? ORDER BY class_id,name", [
        sid,
      ])
    : sesi.guruId
      ? await read(
          `SELECT DISTINCT s.id,s.name,s.class_id FROM students s JOIN classes c
          ON c.school_id=s.school_id AND c.id=s.class_id LEFT JOIN teacher_assignments a
          ON a.school_id=s.school_id AND a.class_id=s.class_id AND a.teacher_id=?
          WHERE s.school_id=? AND (a.teacher_id IS NOT NULL OR c.homeroom_teacher_id=?)`,
          [sesi.guruId, sid, sesi.guruId],
        )
      : childClassId && sesi.siswaId
        ? await read("SELECT id,name,class_id FROM students WHERE school_id=? AND id=?", [
            sid,
            sesi.siswaId,
          ])
        : [];
  const timestamp = (value: unknown) => (value ? `${String(value).replace(" ", "T")}Z` : undefined);
  const mappedAssessments = visibleAssessments.map((a) => {
    const studentScores = scores.filter(
      (s) =>
        s["assessment_id"] === a["id"] &&
        (!["walimurid", "siswa"].includes(sesi.peran) || s["student_id"] === sesi.siswaId),
    );
    return {
      id: String(a["id"]),
      schoolId: sid,
      createdAt: timestamp(a["created_at"])!,
      createdBy: String(a["created_by"]),
      teacherId: String(a["teacher_id"]),
      classId: String(a["class_id"]),
      subject: String(a["subject_id"]),
      semester: String(a["semester"]),
      kind: a["kind"] as "Harian" | "PTS" | "PAS",
      title: String(a["title"]),
      deadline: String(a["deadline"]),
      ...(a["published_at"] ? { publishedAt: timestamp(a["published_at"]) } : {}),
      scores: Object.fromEntries(
        studentScores.map((s) => [String(s["student_id"]), Number(s["score"])]),
      ),
      edits: edits
        .filter((e) => e["assessment_id"] === a["id"])
        .map((e) => ({
          studentId: String(e["student_id"]),
          value: e["score"] === null ? null : Number(e["score"]),
          at: timestamp(e["changed_at"])!,
          by: String(e["changed_by"]),
        })),
    };
  });
  return {
    version: 1 as const,
    schoolId: sid,
    items: items.map((r) => ({
      id: String(r["id"]),
      schoolId: sid,
      name: String(r["name"]),
      unit: String(r["unit"]),
      location: String(r["location"]),
      createdAt: timestamp(r["created_at"])!,
      createdBy: String(r["created_by"]),
    })),
    movements: movements.map((r) => ({
      id: String(r["id"]),
      schoolId: sid,
      itemId: String(r["item_id"]),
      delta: Number(r["delta"]),
      kind: r["kind"] as "Masuk" | "Keluar" | "Penyesuaian",
      note: String(r["note"]),
      ...(r["reference_id"] ? { refId: String(r["reference_id"]) } : {}),
      createdAt: timestamp(r["created_at"])!,
      createdBy: String(r["created_by"]),
    })),
    requests: requests
      .filter((r) => admin || own(String(r["created_by"])))
      .map((r) => ({
        id: String(r["id"]),
        schoolId: sid,
        itemId: String(r["item_id"]),
        quantity: Number(r["quantity"]),
        note: String(r["note"]),
        status: r["status"] as "Menunggu" | "Disetujui" | "Ditolak" | "Diserahkan",
        createdAt: timestamp(r["created_at"])!,
        createdBy: String(r["created_by"]),
        ...(r["reviewed_at"]
          ? { reviewedAt: timestamp(r["reviewed_at"]), reviewedBy: String(r["reviewed_by"]) }
          : {}),
        ...(r["handed_at"]
          ? { handedAt: timestamp(r["handed_at"]), handedBy: String(r["handed_by"]) }
          : {}),
      })),
    counts: admin
      ? counts.map((r) => ({
          id: String(r["id"]),
          schoolId: sid,
          itemId: String(r["item_id"]),
          expected: Number(r["expected"]),
          observed: Number(r["observed"]),
          reason: String(r["reason"]),
          status: r["status"] as "Menunggu" | "Disetujui" | "Ditolak",
          createdAt: timestamp(r["created_at"])!,
          createdBy: String(r["created_by"]),
          ...(r["reviewed_at"]
            ? { reviewedAt: timestamp(r["reviewed_at"]), reviewedBy: String(r["reviewed_by"]) }
            : {}),
        }))
      : [],
    roomCapacity: Number(rooms[0]?.["capacity"] ?? 0),
    ...(rooms[0]?.["changed_at"]
      ? {
          roomCapacityChangedAt: timestamp(rooms[0]["changed_at"]),
          roomCapacityChangedBy: String(rooms[0]["changed_by"]),
        }
      : {}),
    bookings: bookings
      .filter(
        (r) =>
          ["pustakawan", "operator", "kepala_sekolah", "auditor"].includes(sesi.peran) ||
          own(String(r["created_by"])),
      )
      .map((r) => ({
        id: String(r["id"]),
        schoolId: sid,
        classId: String(r["class_id"]),
        date: String(r["visit_date"]),
        start: String(r["start_time"]).slice(0, 5),
        end: String(r["end_time"]).slice(0, 5),
        purpose: String(r["purpose"]),
        expected: Number(r["expected"]),
        ...(r["actual"] !== null ? { actual: Number(r["actual"]) } : {}),
        status: r["status"] as
          "Menunggu" | "Dikonfirmasi" | "Ditolak" | "Dibatalkan" | "Selesai" | "Tidak Hadir",
        createdAt: timestamp(r["created_at"])!,
        createdBy: String(r["created_by"]),
        ...(r["reviewed_at"]
          ? { reviewedAt: timestamp(r["reviewed_at"]), reviewedBy: String(r["reviewed_by"]) }
          : {}),
        ...(r["completed_at"]
          ? { completedAt: timestamp(r["completed_at"]), completedBy: String(r["completed_by"]) }
          : {}),
        ...(r["canceled_at"]
          ? { canceledAt: timestamp(r["canceled_at"]), canceledBy: String(r["canceled_by"]) }
          : {}),
      })),
    assessments: mappedAssessments,
    weights: weights.map((r) => ({
      schoolId: sid,
      classId: String(r["class_id"]),
      subject: String(r["subject_id"]),
      semester: String(r["semester"]),
      daily: Number(r["daily"]),
      pts: Number(r["pts"]),
      pas: Number(r["pas"]),
      changedAt: timestamp(r["changed_at"])!,
      changedBy: String(r["changed_by"]),
    })),
    notes: notes.map((r) => ({
      id: String(r["id"]),
      schoolId: sid,
      teacherId: String(r["teacher_id"]),
      semester: String(r["semester"]),
      text: String(r["note"]),
      createdAt: timestamp(r["created_at"])!,
      createdBy: String(r["created_by"]),
    })),
    studentCounts: studentCounts.map((r) => ({
      classId: String(r["class_id"]),
      count: Number(r["n"]),
    })),
    students: visibleStudents.map((r) => ({
      id: String(r["id"]),
      nama: String(r["name"]),
      kelasId: String(r["class_id"]),
    })),
    classes: classes.map((r) => ({
      id: String(r["id"]),
      nama: String(r["name"]),
      tingkat: Number(r["grade"]),
      homeroomTeacherId: r["homeroom_teacher_id"] ? String(r["homeroom_teacher_id"]) : null,
    })),
    subjects: subjects.map((r) => String(r["name"])),
    teachers: teachers.map((r) => ({
      id: String(r["id"]),
      nama: String(r["name"]),
      mapel: String(r["subject"] ?? "-"),
    })),
    teacherAssignments: teacherAssignments.map((r) => ({
      teacherId: String(r["teacher_id"]),
      classId: String(r["class_id"]),
      subject: String(r["subject_id"]),
    })),
  };
});

const str = (value: unknown, max = 120) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new Error("Teks wajib diisi sesuai batas panjang.");
  return value.trim();
};
const integer = (value: unknown, min = 1, max = 1000000) => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max)
    throw new Error("Jumlah tidak valid.");
  return value;
};
const date = (value: unknown) => {
  const valueString = str(value, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(valueString) ||
    new Date(`${valueString}T00:00:00Z`).toISOString().slice(0, 10) !== valueString
  )
    throw new Error("Tanggal tidak valid.");
  return valueString;
};
const choice = <T extends string>(value: unknown, choices: readonly T[]) => {
  if (typeof value !== "string" || !choices.includes(value as T))
    throw new Error("Pilihan tidak valid.");
  return value as T;
};

async function one(db: PoolConnection, sql: string, values: Array<string | number>) {
  const [rows] = await db.execute<RowDataPacket[]>(sql, values);
  return rows[0];
}
async function allRows(db: PoolConnection, sql: string, values: Array<string | number>) {
  return (await db.execute<RowDataPacket[]>(sql, values))[0];
}
async function write(db: PoolConnection, sql: string, values: Array<string | number | null>) {
  return (await db.execute<ResultSetHeader>(sql, values))[0];
}

export const mutatePriority = createServerFn({ method: "POST" })
  .inputValidator((input) => commandSchema.parse(input))
  .handler(async ({ data: command }) => {
    const { requireIdentity } = await import("@/db/auth.server");
    const { mysqlPool } = await import("@/db/mysql.server");
    const { appendAudit } = await import("@/db/audit.server");
    const { randomUUID } = await import("node:crypto");
    const { userId, sesi } = await requireIdentity();
    const sid = sesi.schoolId!;
    const actor = sesi.email.toLowerCase();
    const role = sesi.peran;
    const p = command.data;
    const db = await mysqlPool().getConnection();
    const deny = (): never => {
      throw new Error("Anda tidak berwenang melakukan tindakan ini.");
    };
    const mustRole = (...roles: string[]) => {
      if (!roles.includes(role)) deny();
    };
    const checkItem = async (id: string) => {
      const item = await one(
        db,
        "SELECT id,balance FROM stock_items WHERE school_id=? AND id=? FOR UPDATE",
        [sid, id],
      );
      if (!item) throw new Error("Barang tidak ditemukan.");
      return item;
    };
    const canBook = async (classId: string) => {
      if (!["guru", "wali_kelas"].includes(role) || !sesi.guruId) return false;
      const row = await one(
        db,
        `SELECT c.id FROM classes c LEFT JOIN teacher_assignments a
         ON a.school_id=c.school_id AND a.class_id=c.id AND a.teacher_id=?
         WHERE c.school_id=? AND c.id=? AND (c.homeroom_teacher_id=? OR a.teacher_id IS NOT NULL) LIMIT 1`,
        [sesi.guruId, sid, classId, sesi.guruId],
      );
      return Boolean(row);
    };
    const canAssess = async (classId: string, subject: string) => {
      if (!["guru", "wali_kelas"].includes(role) || !sesi.guruId) return false;
      return Boolean(
        await one(
          db,
          "SELECT teacher_id FROM teacher_assignments WHERE school_id=? AND teacher_id=? AND class_id=? AND subject_id=?",
          [sid, sesi.guruId, classId, subject],
        ),
      );
    };
    try {
      await db.beginTransaction();
      const dedup = await write(
        db,
        "INSERT IGNORE INTO request_dedup (school_id,request_key,actor_user_id,action_name) VALUES (?,?,?,?)",
        [sid, command.key, userId, command.action],
      );
      if (!dedup.affectedRows) {
        await db.rollback();
        return { ok: true, repeated: true };
      }
      switch (command.action) {
        case "addStockItem": {
          mustRole("operator");
          await write(
            db,
            "INSERT INTO stock_items (school_id,id,name,unit,location,created_at,created_by) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3),?)",
            [
              sid,
              randomUUID(),
              str(p["name"], 80),
              str(p["unit"], 80),
              str(p["location"], 80),
              actor,
            ],
          );
          break;
        }
        case "receiveStock": {
          mustRole("operator", "sarpras");
          const itemId = str(p["itemId"], 40),
            quantity = integer(p["quantity"]),
            note = str(p["note"], 300);
          await checkItem(itemId);
          await write(db, "UPDATE stock_items SET balance=balance+? WHERE school_id=? AND id=?", [
            quantity,
            sid,
            itemId,
          ]);
          await write(
            db,
            "INSERT INTO stock_movements (school_id,id,item_id,delta,kind,note,created_at,created_by) VALUES (?,?,?,?,'Masuk',?,UTC_TIMESTAMP(3),?)",
            [sid, randomUUID(), itemId, quantity, note, actor],
          );
          break;
        }
        case "requestStock": {
          if (["siswa", "walimurid", "auditor", "kepala_sekolah"].includes(role)) deny();
          const itemId = str(p["itemId"], 40),
            quantity = integer(p["quantity"]),
            note = str(p["note"], 300);
          await checkItem(itemId);
          await write(
            db,
            "INSERT INTO stock_requests (school_id,id,item_id,quantity,note,status,created_at,created_by) VALUES (?,?,?,?,?,'Menunggu',UTC_TIMESTAMP(3),?)",
            [sid, randomUUID(), itemId, quantity, note, actor],
          );
          break;
        }
        case "reviewStockRequest": {
          mustRole("sarpras");
          const id = str(p["requestId"], 40);
          const row = await one(
            db,
            "SELECT status FROM stock_requests WHERE school_id=? AND id=? FOR UPDATE",
            [sid, id],
          );
          if (row?.["status"] !== "Menunggu")
            throw new Error("Permintaan tidak tersedia atau sudah ditinjau.");
          await write(
            db,
            "UPDATE stock_requests SET status=?,reviewed_at=UTC_TIMESTAMP(3),reviewed_by=? WHERE school_id=? AND id=?",
            [p["approve"] === true ? "Disetujui" : "Ditolak", actor, sid, id],
          );
          break;
        }
        case "handOverStock": {
          mustRole("sarpras");
          const id = str(p["requestId"], 40);
          const request = await one(
            db,
            "SELECT * FROM stock_requests WHERE school_id=? AND id=? FOR UPDATE",
            [sid, id],
          );
          if (request?.["status"] !== "Disetujui")
            throw new Error("Permintaan belum disetujui atau sudah diserahkan.");
          const itemId = String(request["item_id"]),
            quantity = Number(request["quantity"]);
          const item = await checkItem(itemId);
          if (Number(item["balance"]) < quantity)
            throw new Error("Stok tidak mencukupi saat penyerahan.");
          await write(db, "UPDATE stock_items SET balance=balance-? WHERE school_id=? AND id=?", [
            quantity,
            sid,
            itemId,
          ]);
          await write(
            db,
            "UPDATE stock_requests SET status='Diserahkan',handed_at=UTC_TIMESTAMP(3),handed_by=? WHERE school_id=? AND id=?",
            [actor, sid, id],
          );
          await write(
            db,
            "INSERT INTO stock_movements (school_id,id,item_id,delta,kind,note,reference_id,created_at,created_by) VALUES (?,?,?,?,'Keluar',?,?,UTC_TIMESTAMP(3),?)",
            [sid, randomUUID(), itemId, -quantity, String(request["note"]), id, actor],
          );
          break;
        }
        case "submitStockCount": {
          mustRole("sarpras");
          const itemId = str(p["itemId"], 40),
            observed = integer(p["observed"], 0),
            reason = str(p["reason"], 300);
          const item = await checkItem(itemId);
          const pending = await one(
            db,
            "SELECT id FROM stock_counts WHERE school_id=? AND item_id=? AND status='Menunggu' LIMIT 1",
            [sid, itemId],
          );
          if (pending) throw new Error("Masih ada opname yang menunggu persetujuan.");
          await write(
            db,
            "INSERT INTO stock_counts (school_id,id,item_id,expected,observed,reason,status,created_at,created_by) VALUES (?,?,?,?,?,?,'Menunggu',UTC_TIMESTAMP(3),?)",
            [sid, randomUUID(), itemId, Number(item["balance"]), observed, reason, actor],
          );
          break;
        }
        case "reviewStockCount": {
          mustRole("operator");
          const id = str(p["countId"], 40),
            approve = p["approve"] === true;
          const count = await one(
            db,
            "SELECT * FROM stock_counts WHERE school_id=? AND id=? FOR UPDATE",
            [sid, id],
          );
          if (count?.["status"] !== "Menunggu")
            throw new Error("Opname tidak tersedia atau sudah ditinjau.");
          const itemId = String(count["item_id"]),
            item = await checkItem(itemId);
          const expected = Number(count["expected"]),
            observed = Number(count["observed"]);
          if (approve && Number(item["balance"]) !== expected)
            throw new Error("Stok berubah sejak opname; lakukan hitung ulang.");
          await write(
            db,
            "UPDATE stock_counts SET status=?,reviewed_at=UTC_TIMESTAMP(3),reviewed_by=? WHERE school_id=? AND id=?",
            [approve ? "Disetujui" : "Ditolak", actor, sid, id],
          );
          if (approve && observed !== expected) {
            await write(db, "UPDATE stock_items SET balance=? WHERE school_id=? AND id=?", [
              observed,
              sid,
              itemId,
            ]);
            await write(
              db,
              "INSERT INTO stock_movements (school_id,id,item_id,delta,kind,note,reference_id,created_at,created_by) VALUES (?,?,?,?,'Penyesuaian',?,?,UTC_TIMESTAMP(3),?)",
              [sid, randomUUID(), itemId, observed - expected, String(count["reason"]), id, actor],
            );
          }
          break;
        }
        case "setRoomCapacity": {
          mustRole("pustakawan");
          const capacity = integer(p["capacity"], 1, 200);
          await write(
            db,
            `INSERT INTO library_rooms (school_id,id,name,capacity,changed_at,changed_by)
            VALUES (?,'LIB-01','Ruang Perpustakaan',?,UTC_TIMESTAMP(3),?)
            ON DUPLICATE KEY UPDATE capacity=VALUES(capacity),changed_at=VALUES(changed_at),changed_by=VALUES(changed_by)`,
            [sid, capacity, actor],
          );
          break;
        }
        case "createBooking": {
          const classId = str(p["classId"], 40),
            day = date(p["day"]);
          const start = str(p["start"], 5),
            end = str(p["end"], 5),
            purpose = str(p["purpose"], 300);
          const expected = integer(p["expected"], 1, 200);
          const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
          if (!(await canBook(classId))) deny();
          if (
            day < today ||
            !/^\d{2}:\d{2}$/.test(start) ||
            !/^\d{2}:\d{2}$/.test(end) ||
            start >= end ||
            start < "06:00" ||
            end > "18:00"
          )
            throw new Error("Tanggal atau jam kunjungan tidak valid.");
          const room = await one(
            db,
            "SELECT capacity FROM library_rooms WHERE school_id=? AND id='LIB-01' FOR UPDATE",
            [sid],
          );
          if (!room) throw new Error("Ruang perpustakaan belum dikonfigurasi.");
          if (expected > Number(room["capacity"]))
            throw new Error("Peserta melebihi kapasitas ruang.");
          await write(
            db,
            `INSERT INTO room_bookings
            (school_id,id,room_id,class_id,visit_date,start_time,end_time,purpose,expected,status,created_at,created_by)
            VALUES (?,?,'LIB-01',?,?,?,?,?,?,'Menunggu',UTC_TIMESTAMP(3),?)`,
            [sid, randomUUID(), classId, day, start, end, purpose, expected, actor],
          );
          break;
        }
        case "reviewBooking": {
          mustRole("pustakawan");
          const id = str(p["bookingId"], 40),
            approve = p["approve"] === true;
          // The room row serializes confirmations, including overlapping distinct bookings.
          await one(
            db,
            "SELECT id FROM library_rooms WHERE school_id=? AND id='LIB-01' FOR UPDATE",
            [sid],
          );
          const booking = await one(
            db,
            "SELECT * FROM room_bookings WHERE school_id=? AND id=? FOR UPDATE",
            [sid, id],
          );
          if (booking?.["status"] !== "Menunggu")
            throw new Error("Booking tidak tersedia atau sudah ditinjau.");
          if (approve) {
            const conflict = await one(
              db,
              `SELECT id FROM room_bookings WHERE school_id=? AND room_id=? AND visit_date=?
              AND status='Dikonfirmasi' AND start_time<? AND end_time>? AND id<>? LIMIT 1`,
              [
                sid,
                String(booking["room_id"]),
                String(booking["visit_date"]),
                String(booking["end_time"]),
                String(booking["start_time"]),
                id,
              ],
            );
            if (conflict) throw new Error("Slot ruang perpustakaan bertabrakan.");
          }
          await write(
            db,
            "UPDATE room_bookings SET status=?,reviewed_at=UTC_TIMESTAMP(3),reviewed_by=? WHERE school_id=? AND id=?",
            [approve ? "Dikonfirmasi" : "Ditolak", actor, sid, id],
          );
          break;
        }
        case "cancelBooking": {
          const id = str(p["bookingId"], 40);
          const booking = await one(
            db,
            "SELECT status,created_by FROM room_bookings WHERE school_id=? AND id=? FOR UPDATE",
            [sid, id],
          );
          if (
            !booking ||
            !["Menunggu", "Dikonfirmasi"].includes(String(booking["status"])) ||
            (role !== "pustakawan" && booking["created_by"] !== actor)
          )
            throw new Error("Booking tidak dapat dibatalkan.");
          await write(
            db,
            "UPDATE room_bookings SET status='Dibatalkan',canceled_at=UTC_TIMESTAMP(3),canceled_by=? WHERE school_id=? AND id=?",
            [actor, sid, id],
          );
          break;
        }
        case "completeBooking": {
          mustRole("pustakawan");
          const id = str(p["bookingId"], 40);
          const actual = p["actual"] === null ? null : integer(p["actual"], 1, 200);
          const booking = await one(
            db,
            "SELECT * FROM room_bookings WHERE school_id=? AND id=? FOR UPDATE",
            [sid, id],
          );
          if (booking?.["status"] !== "Dikonfirmasi")
            throw new Error("Booking tidak dapat diselesaikan.");
          const now = new Date();
          const today = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
          const time = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).format(now);
          if (
            String(booking["visit_date"]) > today ||
            (String(booking["visit_date"]) === today &&
              String(booking["end_time"]).slice(0, 5) > time)
          )
            throw new Error("Kunjungan baru dapat dicatat setelah slot selesai.");
          await write(
            db,
            "UPDATE room_bookings SET status=?,actual=?,completed_at=UTC_TIMESTAMP(3),completed_by=? WHERE school_id=? AND id=?",
            [actual === null ? "Tidak Hadir" : "Selesai", actual, actor, sid, id],
          );
          break;
        }
        case "createAssessment": {
          const classId = str(p["classId"], 40),
            subject = str(p["subject"], 60);
          if (!(await canAssess(classId, subject))) deny();
          const semester = str(p["semester"], 40),
            kind = choice(p["kind"], ["Harian", "PTS", "PAS"] as const);
          const title = str(p["title"], 160),
            deadline = date(p["deadline"]);
          await write(
            db,
            `INSERT INTO grade_assessments
            (school_id,id,teacher_id,class_id,subject_id,semester,kind,title,deadline,created_at,created_by)
            VALUES (?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(3),?)`,
            [
              sid,
              randomUUID(),
              sesi.guruId!,
              classId,
              subject,
              semester,
              kind,
              title,
              deadline,
              actor,
            ],
          );
          break;
        }
        case "setAssessmentScore": {
          const id = str(p["assessmentId"], 40),
            studentId = str(p["studentId"], 40);
          const value = p["value"] === null ? null : p["value"];
          if (
            value !== null &&
            (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100)
          )
            throw new Error("Nilai harus 0–100.");
          const assessment = await one(
            db,
            "SELECT * FROM grade_assessments WHERE school_id=? AND id=? FOR UPDATE",
            [sid, id],
          );
          if (!assessment) throw new Error("Penilaian tidak ditemukan.");
          if (
            assessment["teacher_id"] !== sesi.guruId ||
            !(await canAssess(String(assessment["class_id"]), String(assessment["subject_id"])))
          )
            deny();
          const student = await one(
            db,
            "SELECT id FROM students WHERE school_id=? AND id=? AND class_id=?",
            [sid, studentId, String(assessment["class_id"])],
          );
          if (!student) throw new Error("Siswa tidak berada di kelas penilaian ini.");
          const existing = await one(
            db,
            "SELECT score FROM grade_scores WHERE school_id=? AND assessment_id=? AND student_id=?",
            [sid, id, studentId],
          );
          if ((existing ? Number(existing["score"]) : null) === value) break;
          if (value === null)
            await write(
              db,
              "DELETE FROM grade_scores WHERE school_id=? AND assessment_id=? AND student_id=?",
              [sid, id, studentId],
            );
          else
            await write(
              db,
              `INSERT INTO grade_scores (school_id,assessment_id,student_id,score,changed_at,changed_by)
            VALUES (?,?,?,?,UTC_TIMESTAMP(3),?) ON DUPLICATE KEY UPDATE score=VALUES(score),changed_at=VALUES(changed_at),changed_by=VALUES(changed_by)`,
              [sid, id, studentId, value as number, actor],
            );
          await write(
            db,
            "INSERT INTO grade_score_edits (school_id,id,assessment_id,student_id,score,changed_at,changed_by) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3),?)",
            [sid, randomUUID(), id, studentId, value as number | null, actor],
          );
          break;
        }
        case "publishAssessment": {
          const id = str(p["assessmentId"], 40);
          const assessment = await one(
            db,
            "SELECT * FROM grade_assessments WHERE school_id=? AND id=? FOR UPDATE",
            [sid, id],
          );
          if (!assessment) throw new Error("Penilaian tidak ditemukan.");
          if (
            assessment["published_at"] ||
            assessment["teacher_id"] !== sesi.guruId ||
            !(await canAssess(String(assessment["class_id"]), String(assessment["subject_id"])))
          )
            deny();
          const studentCount = await one(
            db,
            "SELECT COUNT(*) AS n FROM students WHERE school_id=? AND class_id=?",
            [sid, String(assessment["class_id"])],
          );
          const scoreCount = await one(
            db,
            "SELECT COUNT(*) AS n FROM grade_scores WHERE school_id=? AND assessment_id=?",
            [sid, id],
          );
          if (
            !Number(studentCount?.["n"]) ||
            Number(studentCount?.["n"]) !== Number(scoreCount?.["n"])
          )
            throw new Error("Isi nilai seluruh siswa sebelum publikasi.");
          await write(
            db,
            "UPDATE grade_assessments SET published_at=UTC_TIMESTAMP(3) WHERE school_id=? AND id=?",
            [sid, id],
          );
          break;
        }
        case "setGradeWeights": {
          mustRole("operator");
          const classId = str(p["classId"], 40),
            subject = str(p["subject"], 60),
            semester = str(p["semester"], 40);
          const daily = integer(p["daily"], 0, 100),
            pts = integer(p["pts"], 0, 100),
            pas = integer(p["pas"], 0, 100);
          if (daily + pts + pas !== 100)
            throw new Error("Bobot Harian, PTS, dan PAS harus berjumlah 100%.");
          await write(
            db,
            `INSERT INTO grade_weights (school_id,class_id,subject_id,semester,daily,pts,pas,changed_at,changed_by)
            VALUES (?,?,?,?,?,?,?,UTC_TIMESTAMP(3),?) ON DUPLICATE KEY UPDATE daily=VALUES(daily),pts=VALUES(pts),pas=VALUES(pas),changed_at=VALUES(changed_at),changed_by=VALUES(changed_by)`,
            [sid, classId, subject, semester, daily, pts, pas, actor],
          );
          break;
        }
        case "addTeacherKpiNote": {
          mustRole("kepala_sekolah");
          await write(
            db,
            "INSERT INTO teacher_kpi_notes (school_id,id,teacher_id,semester,note,created_at,created_by) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3),?)",
            [
              sid,
              randomUUID(),
              str(p["teacherId"], 40),
              str(p["semester"], 40),
              str(p["note"], 1000),
              actor,
            ],
          );
          break;
        }
      }
      const refs = Object.fromEntries(
        ["itemId", "requestId", "countId", "bookingId", "assessmentId", "studentId", "teacherId"]
          .filter((key) => typeof p[key] === "string")
          .map((key) => [key, p[key] as string]),
      );
      await appendAudit(db, sid, actor, command.action, { requestKey: command.key, ...refs });
      await db.commit();
      return { ok: true, repeated: false };
    } catch (error) {
      await db.rollback();
      throw error;
    } finally {
      db.release();
    }
  });
