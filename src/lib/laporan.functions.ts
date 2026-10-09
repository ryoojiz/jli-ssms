import { createOpenAI } from "@ai-sdk/openai";
import { createServerFn } from "@tanstack/react-start";
import { Output, streamText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";

const MasukanLaporan = z.object({
  judul: z.string().max(200).optional(),
  periode: z.string().max(120).optional(),
  teks: z.string().min(40, "Teks laporan terlalu pendek (minimal 40 karakter)."),
});

const SkemaHasil = z.object({
  ringkasan: z.string(),
  poinUtama: z.array(z.string()),
  rekomendasi: z.array(
    z.object({
      judul: z.string(),
      langkah: z.string(),
      prioritas: z.enum(["Tinggi", "Sedang", "Rendah"]),
      penanggungJawab: z.string(),
      tenggat: z.string(),
    }),
  ),
  risiko: z.array(z.string()),
});

export type HasilAnalisisLaporan = z.infer<typeof SkemaHasil>;

export const analisisLaporanSekolah = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MasukanLaporan.parse(input))
  .handler(async ({ data }): Promise<HasilAnalisisLaporan> => {
    const { requireIdentity } = await import("@/db/auth.server");
    await requireIdentity(["kepala_sekolah", "operator", "auditor", "bendahara"]);
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Layanan AI belum tersedia (kunci API tidak ditemukan).");

    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      output: Output.object({ schema: SkemaHasil }),
      system:
        "Anda asisten kepala sekolah dasar negeri di DKI Jakarta. Analisis laporan sekolah dan jawab " +
        "dalam Bahasa Indonesia formal, ringkas, dan konkret sesuai konteks pendidikan dasar. " +
        "Ringkasan maksimal 5 kalimat, poin utama maksimal 6 butir, rekomendasi 3-5 butir dengan " +
        "langkah tindak lanjut yang bisa langsung dieksekusi, risiko maksimal 4 butir. " +
        "Tenggat ditulis relatif (mis. '2 minggu', 'akhir semester').",
      prompt: [
        data.judul ? `Judul laporan: ${data.judul}` : null,
        data.periode ? `Periode: ${data.periode}` : null,
        "Isi laporan:",
        data.teks,
      ]
        .filter(Boolean)
        .join("\n"),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          store: false,
        },
      },
    });

    return await result.output;
  });
