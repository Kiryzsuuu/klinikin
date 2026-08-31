import { groq } from "@ai-sdk/groq";

// Provider: Groq (butuh GROQ_API_KEY dari https://console.groq.com/keys di .env.local).
// Model ID diambil dari env karena daftar model Groq berubah cukup sering — cek model
// terbaru & masih didukung di https://console.groq.com/docs/models sebelum deploy.
export function getAiModel() {
  const modelId = process.env.GROQ_MODEL;
  if (!modelId) {
    throw new Error(
      "GROQ_MODEL belum diisi di .env.local. Lihat daftar model terbaru di https://console.groq.com/docs/models (contoh saat ini: llama-3.3-70b-versatile atau openai/gpt-oss-120b)."
    );
  }
  return groq(modelId);
}
