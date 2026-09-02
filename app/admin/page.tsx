import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Branch } from "@/models/Branch";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { Invoice } from "@/models/Invoice";
import { Booking } from "@/models/Booking";
import { Card } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import RevenueForecast from "./RevenueForecast";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  await connectDB();

  const clinicFilter = { clinicId: session.clinicId };
  const clinicObjectId = session.clinicId ? new mongoose.Types.ObjectId(session.clinicId) : null;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalBranches,
    totalPatients,
    visitsThisMonth,
    revenueAgg,
    pendingBookings,
    byRole,
    visitsByStatus,
  ] = await Promise.all([
    User.countDocuments(clinicFilter),
    Branch.countDocuments({ ...clinicFilter, isActive: true }),
    Patient.countDocuments({ ...clinicFilter, isActive: true }),
    Visit.countDocuments({ ...clinicFilter, visitDate: { $gte: startOfMonth } }),
    Invoice.aggregate([
      { $match: { clinicId: clinicObjectId, "payment.status": "PAID", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Booking.countDocuments({ ...clinicFilter, status: "PENDING" }),
    User.aggregate([{ $match: { clinicId: clinicObjectId } }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
    Visit.aggregate([{ $match: { clinicId: clinicObjectId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const revenueThisMonth = revenueAgg[0]?.total || 0;

  // KPI dokter: jumlah kunjungan & kunjungan selesai bulan ini
  const kpiByDoctor = await Visit.aggregate([
    { $match: { clinicId: clinicObjectId, visitDate: { $gte: startOfMonth } } },
    {
      $group: {
        _id: "$doctorId",
        totalVisits: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
      },
    },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "doctor" } },
    { $unwind: "$doctor" },
    { $sort: { totalVisits: -1 } },
    { $limit: 10 },
  ]);

  const stats = [
    { label: "Total Cabang", value: totalBranches, tone: "bg-green" },
    { label: "Total Pasien", value: totalPatients, tone: "bg-lime" },
    { label: "Kunjungan Bulan Ini", value: visitsThisMonth, tone: "bg-dark" },
    { label: "Booking Menunggu", value: pendingBookings, tone: "bg-green" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Dashboard</h1>
        <p className="text-dark/60">Ringkasan bisnis KlinikKita lintas cabang.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${s.tone} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
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
        <p className="text-sm text-white/60">Pendapatan Bulan Ini (invoice lunas)</p>
        <p className="text-3xl font-semibold text-lime mt-1">Rp {revenueThisMonth.toLocaleString("id-ID")}</p>
      </Card>

      <RevenueForecast />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-dark mb-4">Distribusi Role Pengguna</h2>
          <div className="space-y-2">
            {byRole.map((r: { _id: string; count: number }) => (
              <BarRow key={r._id} label={r._id} value={r.count} total={totalUsers} />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-dark mb-4">Status Kunjungan</h2>
          <div className="space-y-2">
            {visitsByStatus.map((v: { _id: string; count: number }) => (
              <BarRow
                key={v._id}
                label={v._id}
                value={v.count}
                total={visitsByStatus.reduce((s: number, x: { count: number }) => s + x.count, 0)}
              />
            ))}
            {visitsByStatus.length === 0 && <p className="text-dark/40 text-sm">Belum ada data kunjungan</p>}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-dark mb-4">KPI Dokter — Kunjungan Bulan Ini</h2>
        <div className="space-y-2">
          {kpiByDoctor.length === 0 && <p className="text-dark/40 text-sm">Belum ada data kunjungan bulan ini</p>}
          {kpiByDoctor.map((k: { _id: string; totalVisits: number; done: number; doctor: { name: string } }) => (
            <div key={k._id} className="flex items-center justify-between py-1.5 border-b border-dark/5 last:border-0">
              <span className="text-sm text-dark">{k.doctor.name}</span>
              <span className="text-sm text-dark/60">{k.done}/{k.totalVisits} selesai</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function BarRow({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-dark/70">{label}</span>
      <div className="flex-1 h-2 bg-dark/10 rounded-full overflow-hidden">
        <div className="h-full bg-green" style={{ width: `${Math.min(100, (value / Math.max(total, 1)) * 100)}%` }} />
      </div>
      <span className="text-sm font-medium text-dark w-8 text-right">{value}</span>
    </div>
  );
}
