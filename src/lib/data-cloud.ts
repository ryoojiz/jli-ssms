import { useEffect, useState } from "react";
import { GURU, KELAS, PRESENSI_HARI_INI, SISWA, type Guru, type StatusHadir } from "@/lib/demo-data";
import { ambilDataSekolah } from "@/lib/data-sekolah.functions";

type Hasil = Awaited<ReturnType<typeof ambilDataSekolah>>;

export const kelasKeId = (k: string) => `K${k.trim().toUpperCase()}`;
export const siswaKeId = (kelas: string, nisn: string) => `${kelasKeId(kelas)}-DB${nisn}`;

let versi = 0;
let memuat: Promise<void> | null = null;
const pendengar = new Set<(v: number) => void>();
export const jumlahDariCloud = { guru: 0, kelas: 0, siswa: 0, kehadiran: 0 };

function gabung(d: Hasil) {
  for (const k of d.kelas) {
    const id = kelasKeId(k.id);
    const wali = d.guru.find((g) => g.nip === k.nip_wali)?.nama ?? "-";
    const ada = KELAS.find((x) => x.id === id);
    if (ada) {
      if (wali !== "-") ada.waliKelas = wali;
      if (k.ruang) ada.ruang = k.ruang;
    } else {
      KELAS.push({ id, nama: k.id.toUpperCase(), tingkat: k.tingkat, waliKelas: wali, ruang: k.ruang ?? "-", jumlahSiswa: k.kapasitas ?? 0 });
    }
  }
  KELAS.sort((a, b) => a.nama.localeCompare(b.nama));
  for (const g of d.guru) {
    const id = `DB-${g.nip}`;
    const status: Guru["status"] = g.status === "PPPK" || g.status === "PNS" ? g.status : "Honorer";
    const row = { id, nip: g.nip, nama: g.nama, mapel: g.mapel ?? "-", status };
    const i = GURU.findIndex((x) => x.id === id);
    if (i >= 0) GURU[i] = row;
    else GURU.unshift(row);
  }
  for (const s of d.siswa) {
    const kid = kelasKeId(s.kelas_id);
    if (!KELAS.some((k) => k.id === kid)) {
      KELAS.push({ id: kid, nama: s.kelas_id.toUpperCase(), tingkat: Number.parseInt(s.kelas_id) || 0, waliKelas: "-", ruang: "-", jumlahSiswa: 0 });
    }
    const id = siswaKeId(s.kelas_id, s.nisn);
    const row = {
      id,
      nisn: s.nisn,
      nama: s.nama,
      kelasId: kid,
      jenisKelamin: s.jenis_kelamin === "L" ? ("L" as const) : ("P" as const),
      namaWali: s.nama_wali || s.nama_ibu || s.nama_ayah || "-",
      telpWali: s.telp_wali ?? "-",
      tagUid: "-",
    };
    const i = SISWA.findIndex((x) => x.id === id);
    if (i >= 0) SISWA[i] = row;
    else SISWA.unshift(row);
  }
  const terbaru = new Map<string, Hasil["kehadiran"][number]>();
  for (const h of d.kehadiran) {
    const cur = terbaru.get(h.nisn);
    if (!cur || h.tanggal > cur.tanggal) terbaru.set(h.nisn, h);
  }
  for (const s of d.siswa) {
    const id = siswaKeId(s.kelas_id, s.nisn);
    const h = terbaru.get(s.nisn);
    if (!h) continue;
    const row = { siswaId: id, tanggal: h.tanggal, status: h.status as StatusHadir, jam: "-", sumber: "Manual" as const };
    const i = PRESENSI_HARI_INI.findIndex((p) => p.siswaId === id);
    if (i >= 0) PRESENSI_HARI_INI[i] = row;
    else PRESENSI_HARI_INI.push(row);
  }
  Object.assign(jumlahDariCloud, { guru: d.guru.length, kelas: d.kelas.length, siswa: d.siswa.length, kehadiran: d.kehadiran.length });
}

export function muatUlangDataCloud() {
  memuat = ambilDataSekolah()
    .then((d) => {
      if (!d.error) gabung(d);
      versi += 1;
      pendengar.forEach((f) => f(versi));
    })
    .catch((e) => console.error(e));
  return memuat;
}

/** Menggabungkan data sekolah dari database ke data tampilan dan memicu render ulang. */
export function useDataCloud() {
  const [v, setV] = useState(versi);
  useEffect(() => {
    pendengar.add(setV);
    if (!memuat) void muatUlangDataCloud();
    return () => {
      pendengar.delete(setV);
    };
  }, []);
  return v;
}
