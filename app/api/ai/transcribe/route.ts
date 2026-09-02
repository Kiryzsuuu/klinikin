import { NextRequest } from "next/server";
import { transcribe } from "ai";
import { groq } from "@ai-sdk/groq";
import { CLINICAL_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

// Voice-to-Text RME (PRD 4.2.1) — dokter rekam suara, ditranskrip otomatis lewat
// Groq Whisper untuk mengisi kolom Subjective (SOAP).
export async function POST(req: NextRequest) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;

  const modelId = process.env.GROQ_TRANSCRIBE_MODEL;
  if (!modelId) {
    return fail(
      "CONFIG_ERROR",
      "GROQ_TRANSCRIBE_MODEL belum diisi di .env.local (contoh: whisper-large-v3-turbo). Cek model terbaru di console.groq.com/docs/models.",
      500
    );
  }

  const formData = await req.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof Blob)) return fail("VALIDATION_ERROR", "File audio tidak ditemukan", 422);

  try {
    const buffer = new Uint8Array(await audio.arrayBuffer());
    const result = await transcribe({ model: groq.transcription(modelId), audio: buffer });
    return ok({ text: result.text });
  } catch (err) {
    return fail(
      "AI_ERROR",
      "Gagal mentranskrip audio. Pastikan GROQ_API_KEY dan GROQ_TRANSCRIBE_MODEL sudah dikonfigurasi.",
      500,
      err instanceof Error ? err.message : undefined
    );
  }
}
