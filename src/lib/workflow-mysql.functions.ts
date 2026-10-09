import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const command = z.object({
  key: z.uuid(),
  action: z.enum([
    "createLeaveRequest",
    "reviewLeaveRequest",
    "recordAttendance",
    "publishAnnouncement",
    "markNotificationRead",
  ]),
  data: z.record(z.string(), z.unknown()),
});
export type WorkflowAction = z.infer<typeof command>["action"];

const date = (value: unknown) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  )
    throw new Error("Tanggal tidak valid.");
  return value;
};
const text = (value: unknown, max: number) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new Error("Teks tidak valid.");
  return value.trim();
};
const stamp = (value: unknown) => `${String(value).replace(" ", "T")}Z`;

export const getWorkflowSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const { requireIdentity } = await import("@/db/auth.server");
  const { mysqlPool } = await import("@/db/mysql.server");
  const { userId, sesi } = await requireIdentity();
  const sid = sesi.schoolId!;
  const read = async (sql: string, params: string[]) =>
    (await mysqlPool().execute<RowDataPacket[]>(sql, params))[0];
  let childClass: string | null = null;
  if (["walimurid", "siswa"].includes(sesi.peran)) {
    if (!sesi.siswaId) throw new Error("Akun belum ditautkan ke siswa.");
    const linked =
      sesi.peran === "walimurid"
        ? await read(
            `SELECT s.class_id FROM parent_student_links l JOIN students s ON s.school_id=l.school_id AND s.id=l.student_id
          WHERE l.school_id=? AND l.user_id=? AND l.student_id=?`,
            [sid, userId, sesi.siswaId],
          )
        : await read("SELECT class_id FROM students WHERE school_id=? AND id=?", [
            sid,
            sesi.siswaId,
          ]);
    childClass = linked[0]?.["class_id"] ? String(linked[0]["class_id"]) : null;
    if (!childClass) throw new Error("Hubungan siswa tidak ditemukan.");
  }
  const broad = ["operator", "kepala_sekolah", "auditor"].includes(sesi.peran);
  const classId = sesi.peran === "wali_kelas" ? (sesi.classId ?? null) : null;
  const classes = await read(
    `SELECT c.id,c.name,c.grade,c.room,COALESCE(t.name,'-') AS homeroom,
    (SELECT COUNT(*) FROM students s WHERE s.school_id=c.school_id AND s.class_id=c.id) AS student_count
    FROM classes c LEFT JOIN teachers t ON t.school_id=c.school_id AND t.id=c.homeroom_teacher_id
    WHERE c.school_id=? ORDER BY c.grade,c.name`,
    [sid],
  );
  const students = broad
    ? await read("SELECT * FROM students WHERE school_id=? ORDER BY class_id,name", [sid])
    : childClass
      ? await read("SELECT * FROM students WHERE school_id=? AND id=?", [sid, sesi.siswaId!])
      : classId
        ? await read("SELECT * FROM students WHERE school_id=? AND class_id=? ORDER BY name", [
            sid,
            classId,
          ])
        : [];
  const requests = broad
    ? await read("SELECT * FROM leave_requests WHERE school_id=? ORDER BY requested_at DESC", [sid])
    : childClass
      ? await read(
          "SELECT * FROM leave_requests WHERE school_id=? AND student_id=? ORDER BY requested_at DESC",
          [sid, sesi.siswaId!],
        )
      : classId
        ? await read(
            "SELECT * FROM leave_requests WHERE school_id=? AND class_id=? ORDER BY requested_at DESC",
            [sid, classId],
          )
        : [];
  const attendance = broad
    ? await read(
        "SELECT * FROM attendance_records WHERE school_id=? AND source='Manual' ORDER BY changed_at DESC",
        [sid],
      )
    : childClass
      ? await read(
          "SELECT * FROM attendance_records WHERE school_id=? AND student_id=? AND source='Manual' ORDER BY changed_at DESC",
          [sid, sesi.siswaId!],
        )
      : classId
        ? await read(
            "SELECT * FROM attendance_records WHERE school_id=? AND class_id=? AND source='Manual' ORDER BY changed_at DESC",
            [sid, classId],
          )
        : [];
  const sampleAttendance = broad
    ? await read("SELECT * FROM attendance_records WHERE school_id=? AND source<>'Manual'", [sid])
    : childClass
      ? await read(
          "SELECT * FROM attendance_records WHERE school_id=? AND student_id=? AND source<>'Manual'",
          [sid, sesi.siswaId!],
        )
      : classId
        ? await read(
            "SELECT * FROM attendance_records WHERE school_id=? AND class_id=? AND source<>'Manual'",
            [sid, classId],
          )
        : [];
  const historicLeave = broad
    ? await read(
        "SELECT * FROM historic_leave_samples WHERE school_id=? ORDER BY request_date DESC",
        [sid],
      )
    : [];
  const trends = await read("SELECT * FROM attendance_trends WHERE school_id=?", [sid]);
  const announcements = await read(
    "SELECT * FROM announcements WHERE school_id=? ORDER BY published_at DESC",
    [sid],
  );
  const notifications =
    sesi.peran === "walimurid" && sesi.siswaId
      ? await read(
          "SELECT * FROM notifications WHERE school_id=? AND student_id=? ORDER BY created_at DESC",
          [sid, sesi.siswaId],
        )
      : [];
  const reads =
    sesi.peran === "walimurid"
      ? await read(
          "SELECT notification_id FROM notification_reads WHERE school_id=? AND user_id=?",
          [sid, userId],
        )
      : [];
  const outbound = broad
    ? await read("SELECT * FROM outbound_messages WHERE school_id=? ORDER BY id", [sid])
    : [];
  const childGrade = childClass
    ? await read("SELECT grade FROM classes WHERE school_id=? AND id=?", [sid, childClass])
    : [];
  const grade = Number(childGrade[0]?.["grade"]);
  const visible = (target: string) => {
    if (broad || target === "Semua") return true;
    if (target === "Orang Tua") return sesi.peran === "walimurid";
    if (target === "Guru") return ["guru", "wali_kelas"].includes(sesi.peran);
    if (!Number.isFinite(grade)) return false;
    return target === "Kelas 1-3" ? grade >= 1 && grade <= 3 : grade >= 4 && grade <= 6;
  };
  return {
    version: 1 as const,
    requests: requests.map((r) => ({
      id: String(r["id"]),
      schoolId: sid,
      siswaId: String(r["student_id"]),
      kelasId: String(r["class_id"]),
      kind: r["kind"] as "Izin" | "Sakit",
      date: String(r["request_date"]),
      note: String(r["note"]),
      status: r["status"] as "Menunggu" | "Disetujui" | "Ditolak",
      requestedAt: stamp(r["requested_at"]),
      ...(r["decided_at"]
        ? { decidedAt: stamp(r["decided_at"]), decidedBy: String(r["decided_by"]) }
        : {}),
    })),
    attendance: attendance.map((r) => ({
      id: `${r["student_id"]}:${r["attendance_date"]}`,
      schoolId: sid,
      siswaId: String(r["student_id"]),
      date: String(r["attendance_date"]),
      status: r["status"] as "Hadir" | "Terlambat" | "Izin" | "Sakit" | "Alfa",
      changedAt: stamp(r["changed_at"]),
      changedBy: String(r["changed_by"] ?? "-"),
    })),
    announcements: announcements
      .filter((r) => visible(String(r["target"])))
      .map((r) => ({
        id: String(r["id"]),
        schoolId: sid,
        title: String(r["title"]),
        body: String(r["body"]),
        target: r["target"] as "Semua" | "Orang Tua" | "Guru" | "Kelas 1-3" | "Kelas 4-6",
        publishedAt: stamp(r["published_at"]),
        author: String(r["author"]),
      })),
    notifications: notifications.map((r) => ({
      id: String(r["id"]),
      schoolId: sid,
      siswaId: String(r["student_id"]),
      title: String(r["title"]),
      body: String(r["body"]),
      createdAt: stamp(r["created_at"]),
      sourceKey: String(r["source_key"]),
    })),
    readIds: reads.map((r) => String(r["notification_id"])),
    classes: classes.map((r) => ({
      id: String(r["id"]),
      nama: String(r["name"]),
      tingkat: Number(r["grade"]),
      waliKelas: String(r["homeroom"]),
      ruang: String(r["room"] ?? "-"),
      jumlahSiswa: Number(r["student_count"]),
    })),
    students: students.map((r) => ({
      id: String(r["id"]),
      nisn: String(r["nisn"]),
      nama: String(r["name"]),
      kelasId: String(r["class_id"]),
      jenisKelamin: r["sex"] === "L" ? ("L" as const) : ("P" as const),
      namaWali: String(r["guardian_name"] ?? "-"),
      telpWali: String(r["guardian_phone"] ?? "-"),
      tagUid: String(r["tag_uid"] ?? "-"),
    })),
    sampleAttendance: sampleAttendance.map((r) => ({
      siswaId: String(r["student_id"]),
      tanggal: String(r["attendance_date"]),
      status: r["status"] as "Hadir" | "Terlambat" | "Izin" | "Sakit" | "Alfa",
      jam: r["attendance_time"] ? String(r["attendance_time"]).slice(0, 5) : "-",
      sumber: r["source"] as "QR" | "RFID" | "Face" | "Manual" | "Import",
    })),
    historicLeave: historicLeave.map((r) => ({
      id: String(r["id"]),
      siswa: String(r["student_name"]),
      kelas: String(r["class_name"]),
      jenis: String(r["kind"]),
      tanggal: String(r["request_date"]),
      keterangan: String(r["note"]),
      status: String(r["status"]),
    })),
    trends: trends.map((r) => ({
      hari: String(r["day_label"]),
      persen: Number(r["percent_value"]),
    })),
    outbound: outbound.map((r) => ({
      id: String(r["id"]),
      kanal: String(r["channel_name"]),
      penerima: String(r["recipient"]),
      isi: String(r["body"]),
      waktu: String(r["time_label"]),
      status: String(r["status"]),
    })),
  };
});

export const mutateWorkflow = createServerFn({ method: "POST" })
  .inputValidator((input) => command.parse(input))
  .handler(async ({ data: commandData }) => {
    const { requireIdentity } = await import("@/db/auth.server");
    const { mysqlPool } = await import("@/db/mysql.server");
    const { appendAudit } = await import("@/db/audit.server");
    const { randomUUID } = await import("node:crypto");
    const { userId, sesi } = await requireIdentity();
    const sid = sesi.schoolId!,
      actor = sesi.email.toLowerCase(),
      p = commandData.data;
    const db = await mysqlPool().getConnection();
    const one = async (sql: string, args: Array<string | number>) =>
      (await db.execute<RowDataPacket[]>(sql, args))[0][0];
    const put = async (sql: string, args: Array<string | number | null>) =>
      (await db.execute<ResultSetHeader>(sql, args))[0];
    const deny = (): never => {
      throw new Error("Anda tidak berwenang melakukan tindakan ini.");
    };
    const manageClass = async (classId: string) => {
      if (sesi.peran === "operator") return true;
      if (sesi.peran !== "wali_kelas" || !sesi.guruId) return false;
      return Boolean(
        await one("SELECT id FROM classes WHERE school_id=? AND id=? AND homeroom_teacher_id=?", [
          sid,
          classId,
          sesi.guruId,
        ]),
      );
    };
    try {
      await db.beginTransaction();
      const dedup = await put(
        "INSERT IGNORE INTO request_dedup (school_id,request_key,actor_user_id,action_name) VALUES (?,?,?,?)",
        [sid, commandData.key, userId, commandData.action],
      );
      if (!dedup.affectedRows) {
        await db.rollback();
        return { ok: true, repeated: true };
      }
      switch (commandData.action) {
        case "createLeaveRequest": {
          if (sesi.peran !== "walimurid" || !sesi.siswaId) deny();
          const studentId = sesi.siswaId!;
          const kind = p["kind"] === "Izin" || p["kind"] === "Sakit" ? p["kind"] : null;
          if (!kind) throw new Error("Jenis permohonan tidak valid.");
          const day = date(p["date"]),
            note = text(p["note"], 500);
          const student = await one(
            `SELECT s.class_id FROM parent_student_links l JOIN students s
            ON s.school_id=l.school_id AND s.id=l.student_id
            WHERE l.school_id=? AND l.user_id=? AND l.student_id=? FOR UPDATE`,
            [sid, userId, studentId],
          );
          if (!student) throw new Error("Hubungan orang tua dan siswa tidak ditemukan.");
          const pending = await one(
            "SELECT id FROM leave_requests WHERE school_id=? AND student_id=? AND request_date=? AND status='Menunggu' LIMIT 1",
            [sid, studentId, day],
          );
          if (pending) throw new Error("Sudah ada pengajuan yang menunggu untuk tanggal ini.");
          await put(
            `INSERT INTO leave_requests (school_id,id,student_id,class_id,kind,request_date,note,status,requested_at,requested_by)
            VALUES (?,?,?,?,?,?,?,'Menunggu',UTC_TIMESTAMP(3),?)`,
            [sid, randomUUID(), studentId, String(student["class_id"]), kind, day, note, actor],
          );
          break;
        }
        case "reviewLeaveRequest": {
          const id = text(p["requestId"], 40),
            decision =
              p["decision"] === "Disetujui" || p["decision"] === "Ditolak" ? p["decision"] : null;
          if (!decision) throw new Error("Keputusan tidak valid.");
          const req = await one(
            "SELECT * FROM leave_requests WHERE school_id=? AND id=? FOR UPDATE",
            [sid, id],
          );
          if (!req) throw new Error("Pengajuan tidak ditemukan.");
          if (req["status"] !== "Menunggu" || !(await manageClass(String(req["class_id"])))) deny();
          await put(
            "UPDATE leave_requests SET status=?,decided_at=UTC_TIMESTAMP(3),decided_by=? WHERE school_id=? AND id=?",
            [decision, actor, sid, id],
          );
          if (decision === "Disetujui")
            await put(
              `INSERT INTO attendance_records (school_id,student_id,attendance_date,class_id,status,source,changed_by,changed_at)
              VALUES (?,?,?,?,?,'Manual',?,UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE status=VALUES(status),source=VALUES(source),changed_by=VALUES(changed_by),changed_at=VALUES(changed_at)`,
              [
                sid,
                String(req["student_id"]),
                String(req["request_date"]),
                String(req["class_id"]),
                String(req["kind"]),
                actor,
              ],
            );
          await put(
            `INSERT IGNORE INTO notifications (school_id,id,student_id,title,body,source_key,created_at)
            VALUES (?,?,?,?,?,?,UTC_TIMESTAMP(3))`,
            [
              sid,
              randomUUID(),
              String(req["student_id"]),
              `Pengajuan ${String(req["kind"]).toLowerCase()} ${decision.toLowerCase()}`,
              `Pengajuan untuk ${req["request_date"]} telah ${decision.toLowerCase()} oleh ${sesi.nama}`,
              `request:${id}:${decision}`,
            ],
          );
          break;
        }
        case "recordAttendance": {
          const studentId = text(p["studentId"], 40),
            day = date(p["date"]);
          const status = p["status"];
          if (
            typeof status !== "string" ||
            !["Hadir", "Terlambat", "Izin", "Sakit", "Alfa"].includes(status)
          )
            throw new Error("Status tidak valid.");
          const student = await one(
            "SELECT class_id FROM students WHERE school_id=? AND id=? FOR UPDATE",
            [sid, studentId],
          );
          if (!student) throw new Error("Siswa tidak ditemukan.");
          if (!(await manageClass(String(student["class_id"])))) deny();
          const current = await one(
            "SELECT status FROM attendance_records WHERE school_id=? AND student_id=? AND attendance_date=? FOR UPDATE",
            [sid, studentId, day],
          );
          if (current?.["status"] === status) break;
          await put(
            `INSERT INTO attendance_records (school_id,student_id,attendance_date,class_id,status,source,changed_by,changed_at)
            VALUES (?,?,?,?,?,'Manual',?,UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE status=VALUES(status),source=VALUES(source),changed_by=VALUES(changed_by),changed_at=VALUES(changed_at)`,
            [sid, studentId, day, String(student["class_id"]), status, actor],
          );
          await put(
            `INSERT INTO notifications (school_id,id,student_id,title,body,source_key,created_at)
            VALUES (?,?,?,?,?,?,UTC_TIMESTAMP(3))`,
            [
              sid,
              randomUUID(),
              studentId,
              "Kehadiran diperbarui",
              `Status kehadiran ${day}: ${status}. Dicatat oleh ${sesi.nama}.`,
              `attendance:${commandData.key}`,
            ],
          );
          break;
        }
        case "publishAnnouncement": {
          if (sesi.peran !== "operator") deny();
          const target = p["target"];
          if (
            typeof target !== "string" ||
            !["Semua", "Orang Tua", "Guru", "Kelas 1-3", "Kelas 4-6"].includes(target)
          )
            throw new Error("Target tidak valid.");
          await put(
            "INSERT INTO announcements (school_id,id,title,body,target,published_at,author) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3),?)",
            [sid, randomUUID(), text(p["title"], 120), text(p["body"], 2000), target, sesi.nama],
          );
          break;
        }
        case "markNotificationRead": {
          if (sesi.peran !== "walimurid" || !sesi.siswaId) deny();
          const id = text(p["notificationId"], 40);
          const notification = await one(
            `SELECT n.id FROM notifications n JOIN parent_student_links l
            ON l.school_id=n.school_id AND l.student_id=n.student_id
            WHERE n.school_id=? AND n.id=? AND l.user_id=?`,
            [sid, id, userId],
          );
          if (!notification) deny();
          await put(
            "INSERT IGNORE INTO notification_reads (school_id,notification_id,user_id,read_at) VALUES (?,?,?,UTC_TIMESTAMP(3))",
            [sid, id, userId],
          );
          break;
        }
      }
      const refs = Object.fromEntries(
        ["requestId", "studentId", "notificationId"]
          .filter((key) => typeof p[key] === "string")
          .map((key) => [key, p[key] as string]),
      );
      await appendAudit(db, sid, actor, commandData.action, {
        requestKey: commandData.key,
        ...refs,
      });
      await db.commit();
      return { ok: true, repeated: false };
    } catch (error) {
      await db.rollback();
      throw error;
    } finally {
      db.release();
    }
  });
