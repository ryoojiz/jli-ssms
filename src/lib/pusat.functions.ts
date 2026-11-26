/**
 * Data gabungan lintas sekolah untuk akun pusat. Semua query berjalan di server
 * dan hanya diizinkan untuk peran `pusat` (baca saja).
 */
import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";

type Metrik = {
  siswa: number;
  guru: number;
  rombel: number;
  buku: number;
  kehadiran: number;
  kehadiranSampel: number;
  nilai: number;
  nilaiSampel: number;
  pagu: number;
  realisasi: number;
  serapan: number;
  insiden: number;
  insidenTerbuka: number;
  perangkat: number;
  kunjunganUks: number;
  kpi: number;
  kpiWaspada: number;
  audit: number;
};

const angka = (value: unknown) => Number(value ?? 0);
const persen = (bagian: number, total: number) =>
  total > 0 ? Math.round((bagian / total) * 1000) / 10 : 0;

function metrikKosong(): Metrik {
  return {
    siswa: 0,
    guru: 0,
    rombel: 0,
    buku: 0,
    kehadiran: 0,
    kehadiranSampel: 0,
    nilai: 0,
    nilaiSampel: 0,
    pagu: 0,
    realisasi: 0,
    serapan: 0,
    insiden: 0,
    insidenTerbuka: 0,
    perangkat: 0,
    kunjunganUks: 0,
    kpi: 0,
    kpiWaspada: 0,
    audit: 0,
  };
}

type PoolLike = {
  execute<T extends RowDataPacket[]>(sql: string, params?: unknown[]): Promise<[T, unknown]>;
};

/** Mengambil agregat per sekolah; schoolId mengunci hasil ke satu sekolah. */
async function kumpulkanMetrik(db: PoolLike, schoolId?: string) {
  const read = async (selectFrom: string, groupBy: string): Promise<RowDataPacket[]> => {
    const query = schoolId
      ? `${selectFrom} WHERE school_id=? ${groupBy}`
      : `${selectFrom} ${groupBy}`;
    const [rows] = await db.execute<RowDataPacket[]>(query, schoolId ? [schoolId] : []);
    return rows;
  };
  const GROUP = "GROUP BY school_id";
  const [
    siswa,
    guru,
    rombel,
    buku,
    insiden,
    terbuka,
    perangkat,
    uks,
    absen,
    nilai,
    dana,
    kpi,
    audit,
  ] = await Promise.all([
    read("SELECT school_id,COUNT(*) n FROM students", GROUP),
    read("SELECT school_id,COUNT(*) n FROM teachers", GROUP),
    read("SELECT school_id,COUNT(*) n FROM classes", GROUP),
    read("SELECT school_id,COUNT(*) n FROM books", GROUP),
    read("SELECT school_id,COUNT(*) n FROM security_incidents", GROUP),
    read("SELECT school_id,SUM(status='Terbuka') n FROM security_incidents", GROUP),
    read("SELECT school_id,COUNT(*) n FROM devices", GROUP),
    read("SELECT school_id,COUNT(*) n FROM health_visits", GROUP),
    read(
      "SELECT school_id,COUNT(*) n,SUM(status IN ('Hadir','Terlambat')) hadir FROM attendance_records",
      GROUP,
    ),
    read("SELECT school_id,COUNT(*) n,AVG(score) rata FROM historic_grades", GROUP),
    read("SELECT school_id,SUM(budget) pagu,SUM(realized) realisasi FROM budget_lines", GROUP),
    read(
      "SELECT school_id,COUNT(*) n,SUM(status<>'Normal') waspada FROM kpi_catalog",
      GROUP,
    ),
    read("SELECT school_id,COUNT(*) n FROM audit_events", GROUP),
  ]);
  const peta = new Map<string, Metrik>();
  const isi = (rows: RowDataPacket[], assign: (m: Metrik, row: RowDataPacket) => void) => {
    for (const row of rows) {
      const id = String(row["school_id"]);
      const m = peta.get(id) ?? metrikKosong();
      assign(m, row);
      peta.set(id, m);
    }
  };
  isi(siswa, (m, r) => (m.siswa = angka(r["n"])));
  isi(guru, (m, r) => (m.guru = angka(r["n"])));
  isi(rombel, (m, r) => (m.rombel = angka(r["n"])));
  isi(buku, (m, r) => (m.buku = angka(r["n"])));
  isi(insiden, (m, r) => (m.insiden = angka(r["n"])));
  isi(terbuka, (m, r) => (m.insidenTerbuka = angka(r["n"])));
  isi(perangkat, (m, r) => (m.perangkat = angka(r["n"])));
  isi(uks, (m, r) => (m.kunjunganUks = angka(r["n"])));
  isi(absen, (m, r) => {
    m.kehadiranSampel = angka(r["n"]);
    m.kehadiran = persen(angka(r["hadir"]), m.kehadiranSampel);
  });
  isi(nilai, (m, r) => {
    m.nilaiSampel = angka(r["n"]);
    m.nilai = Math.round(angka(r["rata"]) * 10) / 10;
  });
  isi(dana, (m, r) => {
    m.pagu = angka(r["pagu"]);
    m.realisasi = angka(r["realisasi"]);
    m.serapan = persen(m.realisasi, m.pagu);
  });
  isi(kpi, (m, r) => {
    m.kpi = angka(r["n"]);
    m.kpiWaspada = angka(r["waspada"]);
  });
  isi(audit, (m, r) => (m.audit = angka(r["n"])));
  return peta;
}

function totalMetrik(m: Metrik, akumulasi: Metrik) {
  akumulasi.siswa += m.siswa;
  akumulasi.guru += m.guru;
  akumulasi.rombel += m.rombel;
  akumulasi.buku += m.buku;
  akumulasi.insiden += m.insiden;
  akumulasi.insidenTerbuka += m.insidenTerbuka;
  akumulasi.perangkat += m.perangkat;
  akumulasi.kunjunganUks += m.kunjunganUks;
  akumulasi.kehadiranSampel += m.kehadiranSampel;
  akumulasi.nilaiSampel += m.nilaiSampel;
  akumulasi.pagu += m.pagu;
  akumulasi.realisasi += m.realisasi;
  akumulasi.kpi += m.kpi;
  akumulasi.kpiWaspada += m.kpiWaspada;
  akumulasi.audit += m.audit;
}

export const getPusatSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const { requireIdentity } = await import("@/db/auth.server");
  const { mysqlPool } = await import("@/db/mysql.server");
  await requireIdentity(["pusat"]);
  const db = mysqlPool();
  const [schoolRows] = await db.execute<RowDataPacket[]>(
    "SELECT id,name,npsn,short_address,address,principal_name,academic_year,semester FROM schools ORDER BY name",
  );
  const metrik = await kumpulkanMetrik(db as PoolLike);
  const sekolah = schoolRows.map((row) => {
    const id = String(row["id"]);
    const m = metrik.get(id) ?? metrikKosong();
    return {
      id,
      nama: String(row["name"]),
      npsn: row["npsn"] ? String(row["npsn"]) : "—",
      alamat: String(row["short_address"] ?? row["address"] ?? ""),
      kepalaSekolah: row["principal_name"] ? String(row["principal_name"]) : "—",
      tahunAjaran: row["academic_year"] ? String(row["academic_year"]) : "—",
      semester: row["semester"] ? String(row["semester"]) : "—",
      ...m,
      adaData: m.siswa > 0 || m.guru > 0 || m.kehadiranSampel > 0 || m.nilaiSampel > 0,
    };
  });
  const total = metrikKosong();
  for (const s of sekolah) totalMetrik(s, total);
  total.kehadiran = persen(
    sekolah.reduce((sum, s) => sum + (s.kehadiran * s.kehadiranSampel) / 100, 0),
    total.kehadiranSampel,
  );
  total.nilai =
    total.nilaiSampel > 0
      ? Math.round(
          (sekolah.reduce((sum, s) => sum + s.nilai * s.nilaiSampel, 0) / total.nilaiSampel) * 10,
        ) / 10
      : 0;
  total.serapan = persen(total.realisasi, total.pagu);
  const [trenRows] = await db.execute<RowDataPacket[]>(
    `SELECT period_key,ROUND(AVG(attendance),1) kehadiran,ROUND(AVG(grade_average),1) nilai,
      ROUND(AVG(budget_absorption),1) serapan FROM kpi_trends GROUP BY period_key
      ORDER BY FIELD(period_key,'Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des')`,
  );
  return {
    sekolah,
    total,
    tren: trenRows.map((r) => ({
      periode: String(r["period_key"]),
      kehadiran: angka(r["kehadiran"]),
      nilai: angka(r["nilai"]),
      serapan: angka(r["serapan"]),
    })),
    dibuatPada: new Date().toISOString(),
  };
});

export const getPusatSchoolDetail = createServerFn({ method: "GET" })
  .inputValidator((value) => z.object({ schoolId: z.string().min(1).max(32) }).parse(value))
  .handler(async ({ data }) => {
    const { requireIdentity } = await import("@/db/auth.server");
    const { mysqlPool } = await import("@/db/mysql.server");
    await requireIdentity(["pusat"]);
    const db = mysqlPool();
    const sid = data.schoolId;
    const [schoolRows] = await db.execute<RowDataPacket[]>(
      "SELECT id,name,npsn,address,short_address,principal_name,academic_year,semester FROM schools WHERE id=?",
      [sid],
    );
    const school = schoolRows[0];
    if (!school) throw new Error("Sekolah tidak ditemukan.");
    const metrik = (await kumpulkanMetrik(db as PoolLike, sid)).get(sid) ?? metrikKosong();
    const read = async (sql: string) => (await db.execute<RowDataPacket[]>(sql, [sid]))[0];
    const [
      kelasRows,
      mapelRows,
      absenRows,
      anggaranRows,
      kpiRows,
      insidenRows,
      perangkatRows,
      guruRows,
      auditRows,
    ] = await Promise.all([
      read(
        `SELECT c.id,c.name,c.grade,COUNT(s.id) n FROM classes c
           LEFT JOIN students s ON s.school_id=c.school_id AND s.class_id=c.id
           WHERE c.school_id=? GROUP BY c.id,c.name,c.grade ORDER BY c.grade,c.name`,
      ),
      read(
        `SELECT subject_name,COUNT(*) n,ROUND(AVG(score),1) rata FROM historic_grades
           WHERE school_id=? GROUP BY subject_name ORDER BY subject_name`,
      ),
      read(
        `SELECT attendance_date tanggal,COUNT(*) total,
            SUM(status IN ('Hadir','Terlambat')) hadir FROM attendance_records
           WHERE school_id=? GROUP BY attendance_date ORDER BY attendance_date DESC LIMIT 20`,
      ),
      read("SELECT program,budget,realized FROM budget_lines WHERE school_id=? ORDER BY id"),
      read(
        "SELECT name,display_value,target_value,status FROM kpi_catalog WHERE school_id=? ORDER BY name",
      ),
      read(
        "SELECT kind,location,severity,status,occurred_at FROM security_incidents WHERE school_id=? ORDER BY occurred_at DESC LIMIT 20",
      ),
      read("SELECT name,type,location,status FROM devices WHERE school_id=? ORDER BY name"),
      read(
        "SELECT employment_status status,COUNT(*) n FROM teachers WHERE school_id=? GROUP BY employment_status ORDER BY employment_status",
      ),
      read(
        "SELECT actor,action_name,occurred_at FROM audit_events WHERE school_id=? ORDER BY occurred_at DESC LIMIT 10",
      ),
    ]);
    return {
      sekolah: {
        id: sid,
        nama: String(school["name"]),
        npsn: school["npsn"] ? String(school["npsn"]) : "—",
        alamat: String(school["short_address"] ?? school["address"] ?? ""),
        kepalaSekolah: school["principal_name"] ? String(school["principal_name"]) : "—",
        tahunAjaran: school["academic_year"] ? String(school["academic_year"]) : "—",
        semester: school["semester"] ? String(school["semester"]) : "—",
      },
      metrik,
      kelas: kelasRows.map((r) => ({
        id: String(r["id"]),
        nama: String(r["name"]),
        tingkat: angka(r["grade"]),
        siswa: angka(r["n"]),
      })),
      mapel: mapelRows.map((r) => ({
        nama: String(r["subject_name"]),
        jumlah: angka(r["n"]),
        rata: angka(r["rata"]),
      })),
      kehadiran: absenRows.map((r) => ({
        tanggal: String(r["tanggal"]).slice(0, 10),
        total: angka(r["total"]),
        persen: persen(angka(r["hadir"]), angka(r["total"])),
      })),
      anggaran: anggaranRows.map((r) => ({
        program: String(r["program"]),
        pagu: angka(r["budget"]),
        realisasi: angka(r["realized"]),
        serapan: persen(angka(r["realized"]), angka(r["budget"])),
      })),
      kpi: kpiRows.map((r) => ({
        nama: String(r["name"]),
        nilai: String(r["display_value"] ?? "—"),
        target: String(r["target_value"] ?? "—"),
        status: String(r["status"]),
      })),
      insiden: insidenRows.map((r) => ({
        jenis: String(r["kind"]),
        lokasi: String(r["location"]),
        tingkat: String(r["severity"]),
        status: String(r["status"]),
        waktu: String(r["occurred_at"]),
      })),
      perangkat: perangkatRows.map((r) => ({
        nama: String(r["name"]),
        tipe: String(r["type"]),
        lokasi: String(r["location"]),
        status: String(r["status"]),
      })),
      guru: guruRows.map((r) => ({ status: String(r["status"] ?? "—"), jumlah: angka(r["n"]) })),
      audit: auditRows.map((r) => ({
        aktor: String(r["actor"]),
        aksi: String(r["action_name"]),
        waktu: String(r["occurred_at"]),
      })),
    };
  });
