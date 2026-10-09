/** Turunan data akademik dari snapshot sekolah yang telah dimuat dari MySQL. */

import { JADWAL, KELAS, NILAI, SISWA, TUGAS, UJIAN, type Kelas, type Siswa } from "@/lib/demo-data";
import type { Sesi } from "@/lib/rbac";

export const PENGUMPULAN_TUGAS: Array<{
  tugasId: string;
  siswaId: string;
  waktu: string | null;
  terlambat: boolean;
  nilaiAwal: number | null;
}> = [];

/** Kelas yang menjadi tanggung jawab pengguna (guru / wali kelas). */
export function kelasTanggungJawab(sesi: Sesi | null | undefined): Kelas[] {
  if (!sesi) return [];
  if (sesi.peran === "wali_kelas") {
    if (sesi.classId) return KELAS.filter((kelas) => kelas.id === sesi.classId);
    const nama = (sesi.konteks ?? "").replace(/kelas/i, "").trim();
    const cocok = KELAS.filter((k) => k.nama.toLowerCase() === nama.toLowerCase());
    return cocok;
  }
  if (sesi.peran === "guru") {
    const dariJadwal = KELAS.filter((k) =>
      JADWAL.some((j) => j.kelasId === k.id && j.guru === sesi.nama),
    );
    return dariJadwal;
  }
  return KELAS;
}

export function siswaTanggungJawab(sesi: Sesi | null | undefined): Siswa[] {
  const ids = new Set(kelasTanggungJawab(sesi).map((k) => k.id));
  return SISWA.filter((s) => ids.has(s.kelasId));
}

export type BarisPengumpulan = {
  siswa: Siswa;
  sudah: boolean;
  terlambat: boolean;
  waktu: string | null;
  nilaiAwal: number | null;
};

export function tugasById(id: string) {
  return TUGAS.find((t) => t.id === id) ?? null;
}

export function ujianById(id: string) {
  return UJIAN.find((u) => u.id === id) ?? null;
}

/** Status pengumpulan tugas per siswa tersimpan di tabel assignment_submissions. */
export function pengumpulanTugas(tugasId: string): BarisPengumpulan[] {
  const tugas = tugasById(tugasId);
  if (!tugas) return [];
  const daftar = SISWA.filter((s) => s.kelasId === tugas.kelasId);
  const indexed = new Map(
    PENGUMPULAN_TUGAS.filter((r) => r.tugasId === tugasId).map((r) => [r.siswaId, r]),
  );
  return daftar.map((s) => {
    const row = indexed.get(s.id);
    return {
      siswa: s,
      sudah: Boolean(row?.waktu),
      terlambat: row?.terlambat ?? false,
      waktu: row?.waktu ?? null,
      nilaiAwal: row?.nilaiAwal ?? null,
    };
  });
}

/** Nilai ujian awal (prefill) per siswa berdasarkan mapel ujian. */
export function nilaiUjianAwal(ujianId: string): Record<string, string> {
  const ujian = ujianById(ujianId);
  if (!ujian) return {};
  const hasil: Record<string, string> = {};
  for (const s of SISWA.filter((x) => x.kelasId === ujian.kelasId)) {
    const n = NILAI.find((x) => x.siswaId === s.id && x.mapel === ujian.mapel);
    hasil[s.id] = n ? String(n.nilai) : "";
  }
  return hasil;
}

/** Tautan WhatsApp dari nomor lokal Indonesia. */
export function tautanWhatsApp(telp: string, pesan: string) {
  const digit = telp.replace(/\D/g, "");
  const internasional = digit.startsWith("0") ? `62${digit.slice(1)}` : digit;
  return `https://wa.me/${internasional}?text=${encodeURIComponent(pesan)}`;
}
