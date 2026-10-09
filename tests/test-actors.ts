import { SISWA } from "../src/lib/demo-data";
import type { Sesi } from "../src/lib/rbac";

const child = SISWA.find((student) => student.kelasId === "K5A")!;
export const testActors: Sesi[] = [
  { nama: "Operator", email: "operator@test.invalid", peran: "operator" },
  { nama: "Sarpras", email: "sarpras@test.invalid", peran: "sarpras" },
  { nama: "Guru", email: "guru@test.invalid", peran: "guru", guruId: "G10" },
  {
    nama: "Wali Kelas",
    email: "wali@test.invalid",
    peran: "wali_kelas",
    guruId: "G06",
    konteks: "Kelas 5A",
  },
  { nama: "Pustakawan", email: "pustakawan@test.invalid", peran: "pustakawan" },
  { nama: "Kepala Sekolah", email: "kepala@test.invalid", peran: "kepala_sekolah" },
  { nama: "Orang Tua", email: "orangtua@test.invalid", peran: "walimurid", siswaId: child.id },
];
