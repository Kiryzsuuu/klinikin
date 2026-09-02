import { NextRequest } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Medicine } from "@/models/Medicine";
import { Invoice } from "@/models/Invoice";
import { getAiModel } from "@/lib/ai";
import { PHARMACY_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const schema = z.object({ medicineId: z.string() });

const predictionSchema = z.object({
  predictedNeed30Days: z.number().describe("Estimasi kebutuhan unit obat untuk 30 hari ke depan"),
  reorderRecommended: z.boolean(),
  reasoning: z.string().describe("Alasan singkat berdasarkan tren penjualan dan stok saat ini"),
});

// Prediksi Stok Obat (PRD 4.2.1): berdasarkan tren penjualan 30 hari terakhir dari invoice
export async function POST(req: NextRequest) {
  const g = await scopedGuard(PHARMACY_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  await connectDB();
  const medicine = await Medicine.findOne({ _id: parsed.data.medicineId, ...clinicFilter });
  if (!medicine) return fail("MEDICINE_NOT_FOUND", "Obat tidak ditemukan", 404);

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const salesAgg = await Invoice.aggregate([
    { $match: { branchId: medicine.branchId, clinicId: medicine.clinicId, createdAt: { $gte: since } } },
    { $unwind: "$items" },
    { $match: { "items.type": "MEDICINE", "items.name": medicine.name } },
    { $group: { _id: null, totalSold: { $sum: "$items.quantity" } } },
  ]);
  const totalSold30Days = salesAgg[0]?.totalSold || 0;

  try {
    const { object } = await generateObject({
      model: getAiModel(),
      schema: predictionSchema,
      prompt: `Prediksi kebutuhan stok obat untuk 30 hari ke depan berdasarkan data berikut:

Nama obat: ${medicine.name}
Stok saat ini: ${medicine.stock.current} ${medicine.unit}
Stok minimum: ${medicine.stock.minimum} ${medicine.unit}
Total terjual 30 hari terakhir: ${totalSold30Days} ${medicine.unit}

Berikan estimasi kebutuhan 30 hari ke depan dan apakah perlu reorder sekarang.`,
    });

    return ok({ ...object, totalSold30Days, currentStock: medicine.stock.current });
  } catch (err) {
    return fail(
      "AI_ERROR",
      "Gagal membuat prediksi. Pastikan GROQ_API_KEY dan GROQ_MODEL sudah dikonfigurasi.",
      500,
      err instanceof Error ? err.message : undefined
    );
  }
}
