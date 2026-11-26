import assert from "node:assert/strict";
import { test } from "node:test";

import {
  IZIN,
  PERAN_HANYA_BACA,
  SEMUA_MODUL,
  bolehAkses,
  bolehUbah,
  type Modul,
} from "../src/lib/rbac";

test("pusat has auditor-level read access plus the central dashboard", () => {
  for (const modul of SEMUA_MODUL) {
    assert.equal(bolehAkses("pusat", modul), true, `modul ${modul}`);
    assert.equal(bolehAkses("auditor", modul), true, `auditor: ${modul}`);
  }
  assert.equal(bolehAkses("pusat", "pusat"), true);
  assert.equal(bolehAkses("auditor", "pusat"), false);
  assert.deepEqual(IZIN.pusat, [...SEMUA_MODUL, "pusat"]);
});

test("pusat is read-only across every module", () => {
  assert.ok(PERAN_HANYA_BACA.includes("pusat"));
  const modul: Modul[] = [...SEMUA_MODUL, "pusat"];
  for (const item of modul) assert.equal(bolehUbah("pusat", item), false, `modul ${item}`);
});
