import { generateText } from "ai";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { getAiModel } from "@/lib/ai";
import { MANAGE_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

// Revenue Forecast AI (PRD 4.2.4): insight naratif berdasarkan tren pendapatan 6 bulan terakhir
export async function POST() {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;

  await connectDB();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const matchStage: Record<string, unknown> = { "payment.status": "PAID", createdAt: { $gte: sixMonthsAgo } };
  if (session.role !== "SUPER_ADMIN" && session.clinicId) {
    matchStage.clinicId = new mongoose.Types.ObjectId(session.clinicId);
  }

  const monthly = await Invoice.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        total: { $sum: "$total" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  if (monthly.length < 2) {
    return ok({ forecast: "Data pendapatan belum cukup (minimal 2 bulan) untuk membuat forecast yang bermakna." });
  }

  const trendText = monthly
    .map((m: { _id: { year: number; month: number }; total: number; count: number }) => `${m._id.month}/${m._id.year}: Rp ${m.total.toLocaleString("id-ID")} (${m.count} invoice)`)
    .join("\n");

  try {
    const { text } = await generateText({
      model: getAiModel(),
      prompt: `Berikut data pendapatan bulanan klinik 6 bulan terakhir:\n${trendText}\n\nBuat analisis singkat (3-4 kalimat Bahasa Indonesia): tren naik/turun, proyeksi bulan depan secara kasar, dan satu rekomendasi bisnis. Jangan berikan angka pasti yang terkesan seperti jaminan, gunakan kata seperti "diperkirakan".`,
    });

    return ok({ forecast: text, monthly });
  } catch (err) {
    return fail(
      "AI_ERROR",
      "Gagal membuat forecast. Pastikan GROQ_API_KEY dan GROQ_MODEL sudah dikonfigurasi.",
      500,
      err instanceof Error ? err.message : undefined
    );
  }
}
