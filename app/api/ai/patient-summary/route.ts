import { NextRequest } from "next/server";
import { generateText } from "ai";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { getAiModel } from "@/lib/ai";
import { CLINICAL_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const schema = z.object({ patientId: z.string() });

// Auto-Summary Rekam Medis (PRD 4.2.1) — ringkasan riwayat sebelum konsultasi
export async function POST(req: NextRequest) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  await connectDB();
  const patient = await Patient.findOne({ _id: parsed.data.patientId, ...clinicFilter });
  if (!patient) return fail("PATIENT_NOT_FOUND", "Pasien tidak ditemukan", 404);

  const visits = await Visit.find({ patientId: patient._id, ...clinicFilter }).sort({ visitDate: -1 }).limit(10);
  if (visits.length === 0) {
    return ok({ summary: "Belum ada riwayat kunjungan untuk pasien ini." });
  }

  const history = visits
    .map(
      (v) =>
        `- ${new Date(v.visitDate).toLocaleDateString("id-ID")}: Keluhan: ${v.subjective || "-"}; Diagnosis: ${
          v.assessment?.diagnoses?.map((d: { icdDescription?: string }) => d.icdDescription).join(", ") || "-"
        }`
    )
    .join("\n");

  try {
    const { text } = await generateText({
      model: getAiModel(),
      prompt: `Ringkas riwayat medis pasien berikut dalam 3-5 kalimat Bahasa Indonesia untuk membantu dokter memahami konteks pasien secara cepat sebelum konsultasi. Fokus pada pola penyakit berulang, alergi, dan hal penting lain.

Nama: ${patient.name}
Alergi: ${patient.allergies?.join(", ") || "Tidak ada data"}

Riwayat kunjungan terakhir:
${history}`,
    });

    await Visit.findByIdAndUpdate(visits[0]._id, { aiSummary: text });
    return ok({ summary: text });
  } catch (err) {
    return fail(
      "AI_ERROR",
      "Gagal membuat ringkasan. Pastikan GROQ_API_KEY dan GROQ_MODEL sudah dikonfigurasi.",
      500,
      err instanceof Error ? err.message : undefined
    );
  }
}
