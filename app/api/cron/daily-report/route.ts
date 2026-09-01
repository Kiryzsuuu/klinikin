import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Visit } from "@/models/Visit";
import { Invoice } from "@/models/Invoice";
import { User } from "@/models/User";
import { sendMail } from "@/lib/mailer";
import { verifyCronSecret } from "@/lib/cronAuth";

// Dijadwalkan via Vercel Cron (lihat vercel.json) — ringkasan kunjungan & pendapatan
// harian, dikirim ke OWNER/ADMIN_PUSAT setiap malam.
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [visitCount, revenueAgg] = await Promise.all([
    Visit.countDocuments({ visitDate: { $gte: startOfDay, $lte: endOfDay } }),
    Invoice.aggregate([
      { $match: { "payment.status": "PAID", "payment.paidAt": { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);

  const revenue = revenueAgg[0]?.total || 0;
  const recipients = await User.find({ role: { $in: ["OWNER", "ADMIN_PUSAT"] }, isActive: true }).select("email name");

  const html = `
    <h2>Laporan Harian — KlinikHub</h2>
    <p>${startOfDay.toLocaleDateString("id-ID")}</p>
    <ul>
      <li>Total kunjungan: ${visitCount}</li>
      <li>Total pendapatan (lunas): Rp ${revenue.toLocaleString("id-ID")}</li>
    </ul>
  `;

  for (const r of recipients) {
    try {
      await sendMail(r.email, "Laporan Harian - KlinikHub", html);
    } catch {
      // lanjut ke penerima berikutnya walau satu gagal
    }
  }

  return NextResponse.json({ ok: true, visitCount, revenue, notified: recipients.length });
}
