import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Medicine } from "@/models/Medicine";
import { User } from "@/models/User";
import { sendMail } from "@/lib/mailer";
import { verifyCronSecret } from "@/lib/cronAuth";

// Dijadwalkan via Vercel Cron (lihat vercel.json) — cek stok kritis & obat mendekati
// kadaluarsa (<=30 hari), kirim email ringkasan ke OWNER/ADMIN_PUSAT.
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const medicines = await Medicine.find({}).populate("branchId", "name");

  const lowStock = medicines.filter((m) => m.stock.current <= m.stock.minimum);
  const expiringSoon = medicines.filter((m) =>
    m.batches?.some((b: { expiredDate: Date }) => {
      const days = (new Date(b.expiredDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 30;
    })
  );

  if (lowStock.length === 0 && expiringSoon.length === 0) {
    return NextResponse.json({ ok: true, message: "Tidak ada alert" });
  }

  const recipients = await User.find({ role: { $in: ["OWNER", "ADMIN_PUSAT"] }, isActive: true }).select("email name");

  const html = `
    <h2>Alert Stok Obat KlinikKita</h2>
    ${lowStock.length > 0 ? `<h3>Stok Kritis (${lowStock.length})</h3><ul>${lowStock.map((m) => `<li>${m.name}, ${m.branchId?.name}: ${m.stock.current} ${m.unit} (min. ${m.stock.minimum})</li>`).join("")}</ul>` : ""}
    ${expiringSoon.length > 0 ? `<h3>Mendekati Kadaluarsa (${expiringSoon.length})</h3><ul>${expiringSoon.map((m) => `<li>${m.name}, ${m.branchId?.name}</li>`).join("")}</ul>` : ""}
  `;

  for (const r of recipients) {
    try {
      await sendMail(r.email, "Alert Stok Obat - KlinikKita", html);
    } catch {
      // lanjut ke penerima berikutnya walau satu gagal
    }
  }

  return NextResponse.json({ ok: true, lowStock: lowStock.length, expiringSoon: expiringSoon.length, notified: recipients.length });
}
