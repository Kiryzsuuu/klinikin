import { connectDB } from "@/lib/db";
import { Visit } from "@/models/Visit";
import { getOrCreateSettings } from "@/models/SiteSettings";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function PrintVisitPage({ params }: { params: Promise<{ visitId: string }> }) {
  const { visitId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const clinicFilter = session.role === "SUPER_ADMIN" ? {} : { clinicId: session.clinicId };
  const [visit, settings] = await Promise.all([
    Visit.findOne({ _id: visitId, ...clinicFilter })
      .populate("patientId")
      .populate("doctorId", "name")
      .populate("branchId", "name address contact"),
    getOrCreateSettings(),
  ]);

  if (!visit) notFound();

  const hasMeds = visit.plan?.medications?.length > 0;
  const hasReferral = visit.plan?.referral?.isReferred;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white text-dark print:p-0">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print mb-6">
        <PrintButton />
      </div>

      <header className="border-b-2 border-dark pb-4 mb-6">
        <h1 className="text-xl font-bold">{settings.siteName}</h1>
        <p className="text-sm text-dark/60">{visit.branchId?.name}</p>
        <p className="text-sm text-dark/60">{visit.branchId?.address?.street} {visit.branchId?.address?.city}</p>
        <p className="text-sm text-dark/60">{visit.branchId?.contact?.phone}</p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p><b>Nama Pasien:</b> {visit.patientId?.name}</p>
          <p><b>No. RM:</b> {visit.patientId?.medicalRecordNo}</p>
          <p><b>Tanggal Lahir:</b> {visit.patientId?.dateOfBirth ? new Date(visit.patientId.dateOfBirth).toLocaleDateString("id-ID") : "-"}</p>
        </div>
        <div>
          <p><b>No. Kunjungan:</b> {visit.visitNo}</p>
          <p><b>Tanggal:</b> {new Date(visit.visitDate).toLocaleDateString("id-ID")}</p>
          <p><b>Dokter:</b> {visit.doctorId?.name}</p>
        </div>
      </div>

      {hasMeds && (
        <section className="mb-8">
          <h2 className="font-bold text-lg mb-3 border-b border-dark/20 pb-1">℞ Resep</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-dark/10">
                <th className="py-1">Obat</th>
                <th className="py-1">Dosis</th>
                <th className="py-1">Frekuensi</th>
                <th className="py-1">Durasi</th>
              </tr>
            </thead>
            <tbody>
              {visit.plan.medications.map((m: { medicineName: string; dosage: string; frequency: string; duration: string }, i: number) => (
                <tr key={i} className="border-b border-dark/5">
                  <td className="py-1.5">{m.medicineName}</td>
                  <td className="py-1.5">{m.dosage}</td>
                  <td className="py-1.5">{m.frequency}</td>
                  <td className="py-1.5">{m.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {hasReferral && (
        <section className="mb-8">
          <h2 className="font-bold text-lg mb-3 border-b border-dark/20 pb-1">Surat Rujukan</h2>
          <p className="text-sm mb-2"><b>Dirujuk ke:</b> {visit.plan.referral.referralTo}</p>
          <p className="text-sm"><b>Alasan rujukan:</b> {visit.plan.referral.reason}</p>
        </section>
      )}

      {!hasMeds && !hasReferral && (
        <p className="text-dark/40 text-sm mb-8">Tidak ada resep atau rujukan untuk kunjungan ini.</p>
      )}

      <footer className="mt-16 text-sm text-right">
        <p>{visit.branchId?.name}, {new Date(visit.visitDate).toLocaleDateString("id-ID")}</p>
        <div className="h-20" />
        <p className="font-semibold">{visit.doctorId?.name}</p>
      </footer>
    </div>
  );
}
