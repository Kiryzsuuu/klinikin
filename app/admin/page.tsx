import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Card } from "@/components/ui";

export default async function AdminDashboard() {
  await connectDB();

  const [total, active, verified, byRole] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isEmailVerified: true }),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
  ]);

  const stats = [
    { label: "Total Pengguna", value: total, tone: "bg-green" },
    { label: "Pengguna Aktif", value: active, tone: "bg-lime" },
    { label: "Email Terverifikasi", value: verified, tone: "bg-dark" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Dashboard</h1>
        <p className="text-dark/60">Ringkasan sistem KlinikHub.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${s.tone} flex items-center justify-center text-white font-bold text-lg`}>
              {s.value}
            </div>
            <div>
              <p className="text-sm text-dark/60">{s.label}</p>
              <p className="text-xl font-semibold text-dark">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-semibold text-dark mb-4">Distribusi Role</h2>
        <div className="space-y-2">
          {byRole.map((r: { _id: string; count: number }) => (
            <div key={r._id} className="flex items-center gap-3">
              <span className="w-32 text-sm text-dark/70">{r._id}</span>
              <div className="flex-1 h-2 bg-dark/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green"
                  style={{ width: `${Math.min(100, (r.count / Math.max(total, 1)) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-dark w-8 text-right">{r.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
