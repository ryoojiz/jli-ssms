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
        baris: z.array(z.object({ kunci: z.string().min(1).max(300), data: z.record(z.string().max(60), Nilai) })).max(20000),
      }),
    )
    .max(10),
});

export const imporDataModul = createServerFn({ method: "POST" })
  .inputValidator((d) => ImporSchema.parse(d))
  .handler(async ({ data }) => {
    const m = MODUL_IMPOR.find((x) => x.id === data.modul);
    if (!m) throw new Error("Modul tidak dikenal.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hasil: Record<string, number> = {};
    for (const l of data.lembar) {
      if (!m.lembar.some((x) => x.nama === l.nama)) continue;
      const rows = l.baris.map((b) => ({ modul: m.id, lembar: l.nama, kunci: b.kunci, data: b.data, updated_at: new Date().toISOString() }));
      for (let i = 0; i < rows.length; i += 1000) {
        const { error } = await supabaseAdmin.from("data_modul").upsert(rows.slice(i, i + 1000), { onConflict: "modul,lembar,kunci" });
        if (error) {
          console.error(l.nama, error);
          throw new Error(`Gagal menyimpan sheet ${l.nama}.`);
        }
      }
      hasil[l.nama] = rows.length;
    }
    return hasil;
  });

export const ambilDataModul = createServerFn({ method: "GET" })
  .inputValidator((d: { modul: string }) => z.object({ modul: z.string().max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("data_modul")
      .select("lembar,kunci,data,updated_at")
      .eq("modul", data.modul)
      .order("updated_at", { ascending: false })
      .limit(2000);
    if (error) {
      console.error(error);
      return { rows: [], error: "Database tidak dapat dibaca." };
    }
    return { rows: rows as { lembar: string; kunci: string; data: Record<string, string | number | boolean | null>; updated_at: string }[], error: null as string | null };
  });
