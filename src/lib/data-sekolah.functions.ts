import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const teks = (max = 200) => z.string().trim().max(max).nullable().optional();

const GuruSchema = z.object({
  nip: z.string().trim().min(1).max(40),
  nama: z.string().trim().min(1).max(150),
  jenis_kelamin: teks(2),
  jabatan: teks(),
  mapel: teks(),
  wali_kelas: teks(10),
  telp: teks(30),
  email: teks(150),
  status: teks(20),
});
const KelasSchema = z.object({
  id: z.string().trim().min(1).max(10),
  tingkat: z.number().int().min(1).max(12),
  rombel: teks(5),
  nip_wali: teks(40),
  ruang: teks(30),
  kapasitas: z.number().int().min(0).max(100).nullable().optional(),
});
const SiswaSchema = z.object({
  nisn: z.string().trim().min(1).max(20),
  nis: teks(20),
  nama: z.string().trim().min(1).max(150),
  jenis_kelamin: teks(2),
  tanggal_lahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  kelas_id: z.string().trim().min(1).max(10),
  alamat: teks(300),
  nama_ayah: teks(150),
  nama_ibu: teks(150),
  nama_wali: teks(150),
  telp_wali: teks(30),
  email_wali: teks(150),
});
const HadirSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nisn: z.string().trim().min(1).max(20),
  kelas_id: z.string().trim().min(1).max(10),
  status: z.enum(["Hadir", "Terlambat", "Izin", "Sakit", "Alfa"]),
  keterangan: teks(300),
});

const ImporSchema = z.object({
  guru: z.array(GuruSchema).max(500),
  kelas: z.array(KelasSchema).max(200),
  siswa: z.array(SiswaSchema).max(3000),
  kehadiran: z.array(HadirSchema).max(20000),
});
export type DataImpor = z.infer<typeof ImporSchema>;

export const imporDataSekolah = createServerFn({ method: "POST" })
  .inputValidator((d) => ImporSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hasil = { guru: 0, kelas: 0, siswa: 0, kehadiran: 0 };
    for (const [tabel, rows, key] of [
      ["guru", data.guru, "nip"],
      ["kelas", data.kelas, "id"],
      ["siswa", data.siswa, "nisn"],
      ["kehadiran", data.kehadiran, "tanggal,nisn"],
    ] as const) {
      if (rows.length) {
        const { error } = await supabaseAdmin.from(tabel).upsert(rows as never, { onConflict: key });
        if (error) {
          console.error(tabel, error);
          throw new Error(`Gagal menyimpan data ${tabel}.`);
        }
      }
      hasil[tabel] = rows.length;
    }
    return hasil;
  });

export const ambilDataSekolah = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [g, k, s, h] = await Promise.all([
    supabaseAdmin.from("guru").select("nip,nama,mapel,status,wali_kelas"),
    supabaseAdmin.from("kelas").select("id,tingkat,nip_wali,ruang,kapasitas"),
    supabaseAdmin.from("siswa").select("nisn,nama,jenis_kelamin,kelas_id,nama_ayah,nama_ibu,nama_wali,telp_wali"),
    supabaseAdmin.from("kehadiran").select("tanggal,nisn,kelas_id,status"),
  ]);
  const err = g.error || k.error || s.error || h.error;
  if (err) {
    console.error(err);
    return { guru: [], kelas: [], siswa: [], kehadiran: [], error: "Database tidak dapat dibaca." };
  }
  return { guru: g.data, kelas: k.data, siswa: s.data, kehadiran: h.data, error: null as string | null };
});
