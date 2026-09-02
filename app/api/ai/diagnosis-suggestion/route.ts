import { NextRequest } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getAiModel } from "@/lib/ai";
import { CLINICAL_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const schema = z.object({
  symptoms: z.string().min(5),
  vitalSigns: z.string().optional(),
});

const suggestionSchema = z.object({
  suggestions: z
    .array(
      z.object({
        icdCode: z.string().describe("Kode ICD-10, contoh: J06.9"),
        icdDescription: z.string().describe("Deskripsi diagnosis dalam Bahasa Indonesia"),
        reasoning: z.string().describe("Alasan singkat kenapa diagnosis ini relevan berdasarkan gejala"),
        confidence: z.enum(["TINGGI", "SEDANG", "RENDAH"]),
      })
    )
    .min(1)
    .max(5),
  disclaimer: z.string().describe("Peringatan bahwa ini hanya saran, keputusan akhir tetap di tangan dokter"),
});

// Smart Diagnosis Suggestion (PRD 4.2.1): bukan pengganti keputusan klinis dokter
export async function POST(req: NextRequest) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  try {
    const { object } = await generateObject({
      model: getAiModel(),
      schema: suggestionSchema,
      prompt: `Sebagai asisten klinis, berikan saran diagnosis ICD-10 (maksimal 5) berdasarkan gejala/keluhan pasien berikut. Ini HANYA saran pendukung, dokter tetap yang memutuskan diagnosis final.

Keluhan/gejala: ${parsed.data.symptoms}
${parsed.data.vitalSigns ? `Tanda vital: ${parsed.data.vitalSigns}` : ""}`,
    });

    return ok(object);
  } catch (err) {
    return fail(
      "AI_ERROR",
      "Gagal mendapatkan saran diagnosis. Pastikan GROQ_API_KEY dan GROQ_MODEL sudah dikonfigurasi.",
      500,
      err instanceof Error ? err.message : undefined
    );
  }
}
