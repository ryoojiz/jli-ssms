import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MODUL_IMPOR } from "@/lib/modul-impor";

const Nilai = z.union([z.string().max(1000), z.number(), z.boolean(), z.null()]);
const ImporSchema = z.object({
  modul: z.string().max(40),
  lembar: z
    .array(
      z.object({
        nama: z.string().max(60),
        baris: z
          .array(
            z.object({
              kunci: z.string().min(1).max(300),
              data: z.record(z.string().max(60), Nilai),
            }),
          )
          .max(20000),
      }),
    )
    .max(10),
});

export const imporDataModul = createServerFn({ method: "POST" })
  .inputValidator((d) => ImporSchema.parse(d))
  .handler(async ({ data }) => {
    const m = MODUL_IMPOR.find((x) => x.id === data.modul);
    if (!m) throw new Error("Modul tidak dikenal.");
    const { requireIdentity } = await import("@/db/auth.server");
    const { mysqlPool } = await import("@/db/mysql.server");
    const { appendAudit } = await import("@/db/audit.server");
    const { randomUUID } = await import("node:crypto");
    const { persistModuleRow } = await import("@/db/module-import.server");
    const { sesi } = await requireIdentity(["operator"]);
    const sid = sesi.schoolId!;
    const db = await mysqlPool().getConnection();
    const hasil: Record<string, number> = {};
    try {
      await db.beginTransaction();
      const batchId = randomUUID();
      await db.execute(
        "INSERT INTO import_batches (school_id,id,module_name,imported_by,imported_at) VALUES (?,?,?,?,NOW(3))",
        [sid, batchId, m.id, sesi.email],
      );
      for (const l of data.lembar) {
        if (!m.lembar.some((x) => x.nama === l.nama))
          throw new Error(`Sheet ${l.nama} tidak dikenal untuk modul ${m.id}.`);
        for (const b of l.baris) {
          await db.execute(
            `INSERT INTO import_rows (school_id,module_name,sheet_name,row_key,data_json,batch_id,updated_at)
             VALUES (?,?,?,?,?,?,NOW(3)) ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),batch_id=VALUES(batch_id),updated_at=VALUES(updated_at)`,
            [sid, m.id, l.nama, b.kunci, JSON.stringify(b.data), batchId],
          );
          await persistModuleRow(db, sid, l.nama, b.kunci, b.data);
        }
        hasil[l.nama] = l.baris.length;
      }
      await appendAudit(db, sid, sesi.email, "importModule", {
        batchId,
        module: m.id,
        rows: Object.values(hasil).reduce((total, count) => total + count, 0),
      });
      await db.commit();
    } catch (error) {
      await db.rollback();
      throw error;
    } finally {
      db.release();
    }
    return hasil;
  });

export const ambilDataModul = createServerFn({ method: "GET" })
  .inputValidator((d: { modul: string }) => z.object({ modul: z.string().max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { requireIdentity } = await import("@/db/auth.server");
    const { mysqlPool } = await import("@/db/mysql.server");
    const { sesi } = await requireIdentity(["operator", "kepala_sekolah", "auditor"]);
    const [rows] = await mysqlPool().execute(
      "SELECT sheet_name AS lembar,row_key AS kunci,data_json AS data,updated_at FROM import_rows WHERE school_id=? AND module_name=? ORDER BY updated_at DESC LIMIT 2000",
      [sesi.schoolId!, data.modul],
    );
    const mapped = (
      rows as Array<{
        lembar: string;
        kunci: string;
        data: string | Record<string, string | number | boolean | null>;
        updated_at: string;
      }>
    ).map((row) => ({
      ...row,
      data:
        typeof row.data === "string"
          ? (JSON.parse(row.data) as Record<string, string | number | boolean | null>)
          : row.data,
    }));
    return { rows: mapped, error: null as string | null };
  });
