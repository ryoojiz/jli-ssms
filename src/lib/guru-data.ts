/**
 * Turunan data guru (demo, deterministik): kelas yang diampu, status
 * pengumpulan tugas per siswa, dan nilai awal ujian.
 * Nantinya diganti query Lovable Cloud tanpa mengubah UI.
 */

import { JADWAL, KELAS, NILAI, SISWA, TUGAS, UJIAN, type Kelas, type Siswa } from "@/lib/demo-data";
import type { Sesi } from "@/lib/rbac";

function acak(n: number, mod: number) {
  return (((n * 9301 + 49297) % 233280) + 233280) % 233280 % mod;
}

/** Kelas yang menjadi tanggung jawab pengguna (guru / wali kelas). */
export function kelasTanggungJawab(sesi: Sesi | null | undefined): Kelas[] {
  if (!sesi) return [];
  if (sesi.peran === "wali_kelas") {
    const nama = (sesi.konteks ?? "").replace(/kelas/i, "").trim();
    const cocok = KELAS.filter((k) => k.nama.toLowerCase() === nama.toLowerCase());
    if (cocok.length) return cocok;
  }
  if (sesi.peran === "guru") {
    const dariJadwal = KELAS.filter((k) =>
      JADWAL.some((j) => j.kelasId === k.id && j.guru === sesi.nama),
    );
    if (dariJadwal.length) return dariJadwal;
    // Guru demo tanpa jadwal tercatat: tampilkan kelas ampuan contoh.
    return KELAS.filter((k) => ["K4A", "K5A", "K6A"].includes(k.id));
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

/** Status pengumpulan tugas per siswa (deterministik dari jumlah `dikumpulkan`). */
export function pengumpulanTugas(tugasId: string): BarisPengumpulan[] {
  const tugas = tugasById(tugasId);
  if (!tugas) return [];
  const daftar = SISWA.filter((s) => s.kelasId === tugas.kelasId);
  const urutan = daftar
    .map((s, i) => ({ s, skor: acak(i * 31 + tugas.id.length * 7, 1000) }))
    .sort((a, b) => a.skor - b.skor);
  const rasio = tugas.total > 0 ? tugas.dikumpulkan / tugas.total : 0;
  const jumlahKumpul = Math.round(daftar.length * rasio);
  const sudahSet = new Set(urutan.slice(0, jumlahKumpul).map((x) => x.s.id));

  return daftar.map((s, i) => {
    const sudah = sudahSet.has(s.id);
    const terlambat = sudah && acak(i * 17 + 5, 10) < 2;
    return {
      siswa: s,
      sudah,
      terlambat,
      waktu: sudah ? `${tugas.tenggat} ${String(8 + acak(i * 13, 9)).padStart(2, "0")}:${String(acak(i * 7, 60)).padStart(2, "0")}` : null,
      nilaiAwal: sudah ? 65 + acak(i * 23 + 9, 35) : null,
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
