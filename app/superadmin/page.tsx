import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";
import { Card, Badge } from "@/components/ui";

export default async function SuperAdminDashboard() {
  await connectDB();

  const [totalClinics, activeClinics, trialClinics, expiredClinics, activeWithPlan] = await Promise.all([
    Clinic.countDocuments({}),
    Clinic.countDocuments({ "subscription.status": "ACTIVE" }),
    Clinic.countDocuments({ "subscription.status": "TRIAL" }),
    Clinic.countDocuments({ "subscription.status": { $in: ["EXPIRED", "PAST_DUE", "SUSPENDED"] } }),
    Clinic.find({ "subscription.status": "ACTIVE" }).select("subscription.planId"),
  ]);

  const plans = await SubscriptionPlan.find({});
  const priceById = new Map(plans.map((p) => [String(p._id), p.priceMonthly]));
  const mrr = activeWithPlan.reduce((sum, c) => sum + (priceById.get(String(c.subscription?.planId)) || 0), 0);

  const recentClinics = await Clinic.find({}).sort({ createdAt: -1 }).limit(8);

  const stats = [
    { label: "Total Klinik", value: totalClinics, tone: "bg-green" },
    { label: "Aktif Berlangganan", value: activeClinics, tone: "bg-lime" },
    { label: "Masa Trial", value: trialClinics, tone: "bg-dark" },
    { label: "Bermasalah/Expired", value: expiredClinics, tone: "bg-red-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Dashboard Super Admin</h1>
        <p className="text-dark/60">Ringkasan seluruh klinik pelanggan KlinikKita.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-sm ${s.tone} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
              {s.value}
            </div>
            <div>
              <p className="text-sm text-dark/60">{s.label}</p>
              <p className="text-xl font-semibold text-dark">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-dark text-white">
        <p className="text-sm text-white/60">Estimasi MRR (klinik status ACTIVE)</p>
        <p className="text-3xl font-semibold text-lime mt-1">Rp {mrr.toLocaleString("id-ID")}</p>
      </Card>

      <Card>
        <h2 className="font-semibold text-dark mb-4">Klinik Terbaru</h2>
        <div className="space-y-2">
          {recentClinics.map((c) => (
            <div key={String(c._id)} className="flex items-center justify-between py-2 border-b border-dark/5 last:border-0">
              <div>
                <p className="text-sm font-medium text-dark">{c.name}</p>
                <p className="text-xs text-dark/50">{c.slug}</p>
              </div>
              <StatusBadge status={c.subscription?.status} />
            </div>
          ))}
          {recentClinics.length === 0 && <p className="text-dark/40 text-sm">Belum ada klinik terdaftar.</p>}
        </div>
      </Card>
    </div>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  const tone = status === "ACTIVE" ? "green" : status === "TRIAL" ? "lime" : "red";
  return <Badge tone={tone}>{status || "TRIAL"}</Badge>;
}
