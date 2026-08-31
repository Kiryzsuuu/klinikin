import { convertToModelMessages, streamText, UIMessage } from "ai";
import { AI_MODEL } from "@/lib/ai";
import { getSession } from "@/lib/auth";

export const maxDuration = 30;

// Asisten chat AI internal untuk staf klinik (tanya seputar SOP, ICD-10, dsb).
// Bukan pengganti keputusan medis — instruksi sistem menegaskan itu.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: AI_MODEL,
    system:
      "Kamu adalah asisten AI internal untuk staf KlinikHub (platform manajemen klinik multi-cabang di Indonesia). " +
      "Bantu jawab pertanyaan seputar SOP administrasi klinik, penggunaan sistem, istilah medis umum, dan kode ICD-10 secara edukatif. " +
      "SELALU tegaskan bahwa kamu bukan pengganti penilaian klinis dokter dan keputusan diagnosis/terapi final tetap di tangan tenaga medis berwenang. " +
      "Jawab singkat, jelas, dan dalam Bahasa Indonesia.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
