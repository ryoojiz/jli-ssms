import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import type { PoolConnection } from "mysql2/promise";

import { persistModuleRow } from "../src/db/module-import.server";
import { appendAudit } from "../src/db/audit.server";
import { hashPassword, verifyPassword } from "../src/db/password.server";
import { MODUL_IMPOR } from "../src/lib/modul-impor";

function fakeConnection(existingBook?: { stock: number; available: number }) {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const db = {
    execute: async (sql: string, values: unknown[]) => {
      calls.push({ sql, values });
      if (sql.startsWith("SELECT stock,available")) return [[existingBook].filter(Boolean), []];
      if (sql.startsWith("SELECT id FROM students")) return [[{ id: "S-01" }], []];
      if (sql.startsWith("SELECT id FROM teachers")) return [[{ id: "G-01" }], []];
      if (sql.startsWith("SELECT id FROM classes")) return [[{ id: "K5A" }], []];
      return [[], []];
    },
  } as unknown as PoolConnection;
  return { db, calls };
}

test("passwords use salted hashes and reject wrong or malformed input", async () => {
  const password = "contoh-sandi-aman-2026";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("sandi-salah-2026", first), false);
  assert.equal(await verifyPassword(password, "invalid"), false);
  await assert.rejects(hashPassword("pendek"));
});

test("audit records action references without storing free-text request content", async () => {
  const { db, calls } = fakeConnection();
  await appendAudit(db, "SDN-KBG-01", "operator@test.invalid", "handOverStock", {
    requestKey: "request-01",
    requestId: "stock-01",
  });
  const row = calls.find((call) => call.sql.includes("INSERT INTO audit_events"));
  assert.ok(row);
  assert.equal(row.values[0], "SDN-KBG-01");
  assert.equal(row.values[2], "operator@test.invalid");
  assert.deepEqual(JSON.parse(String(row.values[4])), {
    requestKey: "request-01",
    requestId: "stock-01",
  });
});

test("book reimport preserves outstanding loans and rejects impossible stock", async () => {
  const cells = {
    "Kode Buku": "BK-01",
    ISBN: "9781234567890",
    Judul: "Buku Sekolah",
    Pengarang: "Penulis",
    Kategori: "Pendidikan",
    "Jumlah Eksemplar": 7,
  };
  const { db, calls } = fakeConnection({ stock: 5, available: 3 });
  await persistModuleRow(db, "SDN-KBG-01", "Buku Perpustakaan", "BK-01", cells);
  const insert = calls.find((call) => call.sql.startsWith("INSERT INTO `books`"));
  assert.ok(insert);
  assert.equal(insert.values[6], 7);
  assert.equal(insert.values[7], 5);
  await assert.rejects(
    persistModuleRow(db, "SDN-KBG-01", "Buku Perpustakaan", "BK-01", {
      ...cells,
      "Jumlah Eksemplar": 1,
    }),
    /bertentangan/,
  );
});

test("KPI import treats free-text notes as raw source data, not a short status", async () => {
  const { db, calls } = fakeConnection();
  await persistModuleRow(db, "SDN-KBG-01", "KPI", "KPI-01", {
    "Kode KPI": "KPI-01",
    "Nama Indikator": "Kehadiran",
    Keterangan: "Catatan sumber yang panjang dan tidak boleh dipotong diam-diam",
  });
  const insert = calls.find((call) => call.sql.startsWith("INSERT INTO `kpi_catalog`"));
  assert.ok(insert);
  assert.equal(insert.values[10], "Impor");
});

test("schedule import creates the teacher-class-subject authorization link", async () => {
  const { db, calls } = fakeConnection();
  await persistModuleRow(db, "SDN-KBG-01", "Jadwal", "Senin:08:00:5A", {
    "NIP Guru": "199000000000000001",
    Hari: "Senin",
    "Jam Mulai": "08:00",
    "Jam Selesai": "09:00",
    Kelas: "5A",
    "Mata Pelajaran": "Matematika",
    "Nama Guru": "Guru Contoh",
    Ruang: "R-01",
  });
  const assignment = calls.find((call) =>
    call.sql.startsWith("INSERT IGNORE INTO teacher_assignments"),
  );
  assert.ok(assignment);
  assert.deepEqual(assignment.values, ["SDN-KBG-01", "G-01", "K5A", "Matematika"]);
});

test("all Excel sheets have an explicit mapper or integration landing table", () => {
  const source = readFileSync("src/db/module-import.server.ts", "utf8");
  const mapped = new Set([...source.matchAll(/case "([^"]+)":/g)].map((match) => match[1]));
  const integration = new Set([
    "Aset JakAset",
    "Kehadiran ASN",
    "Ketidakhadiran ASN",
    "E-Kinerja",
    "Kepegawaian",
    "RKAS",
    "SIPLah",
    "Dapodik",
    "Mutasi SIAP",
    "Info GTK TPG",
  ]);
  for (const module of MODUL_IMPOR)
    for (const sheet of module.lembar)
      assert.ok(
        mapped.has(sheet.nama) || integration.has(sheet.nama),
        `Sheet ${sheet.nama} belum dipetakan`,
      );
});

test("MySQL migrations are versioned apart from PostgreSQL and cover school-scoped operations", () => {
  const files = readdirSync("database/mysql/migrations")
    .filter((name) => name.endsWith(".sql"))
    .sort();
  assert.ok(files.length >= 7);
  const sql = files
    .map((name) => readFileSync(`database/mysql/migrations/${name}`, "utf8"))
    .join("\n");
  for (const table of [
    "schools",
    "school_memberships",
    "sessions",
    "students",
    "attendance_records",
    "stock_items",
    "room_bookings",
    "grade_assessments",
    "notifications",
    "import_rows",
    "assignment_submissions",
  ])
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
  assert.doesNotMatch(sql, /CREATE DATABASE|DROP TABLE|TRUNCATE TABLE/i);
});
