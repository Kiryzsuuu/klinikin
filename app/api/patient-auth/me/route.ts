import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { LabOrder } from "@/models/LabOrder";
import { getPatientSession } from "@/lib/patientAuth";
import { ok, fail } from "@/lib/response";

// Data pasien untuk portal: profil sendiri + riwayat kunjungan + hasil lab,
// inilah "akses riwayat medis sendiri" dari PRD Patient Portal.
export async function GET() {
  const session = await getPatientSession();
  if (!session) return fail("UNAUTHORIZED", "Belum login", 401);

  await connectDB();
  const [patient, visits, labOrders] = await Promise.all([
    Patient.findById(session.patientId).select("-passwordHash"),
    Visit.find({ patientId: session.patientId })
      .populate("branchId", "name")
      .populate("doctorId", "name")
      .sort({ visitDate: -1 }),
    LabOrder.find({ patientId: session.patientId }).sort({ createdAt: -1 }),
  ]);

  if (!patient) return fail("PATIENT_NOT_FOUND", "Pasien tidak ditemukan", 404);
  return ok({ patient, visits, labOrders });
}
