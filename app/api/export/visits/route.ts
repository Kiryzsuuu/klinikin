import { connectDB } from "@/lib/db";
import { Visit } from "@/models/Visit";
import { CLINICAL_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  await connectDB();
  const visits = await Visit.find({ ...clinicFilter })
    .populate("patientId", "name medicalRecordNo")
    .populate("doctorId", "name")
    .populate("branchId", "name")
    .sort({ visitDate: -1 })
    .limit(5000);

  const csv = toCsv(
    visits.map((v) => ({
      visitNo: v.visitNo,
      patient: (v.patientId as unknown as { name?: string })?.name || "",
      medicalRecordNo: (v.patientId as unknown as { medicalRecordNo?: string })?.medicalRecordNo || "",
      doctor: (v.doctorId as unknown as { name?: string })?.name || "",
      branch: (v.branchId as unknown as { name?: string })?.name || "",
      status: v.status,
      diagnosis: v.assessment?.diagnoses?.map((d: { icdDescription?: string }) => d.icdDescription).join("; ") || "",
      visitDate: v.visitDate.toISOString().slice(0, 10),
    })),
    [
      { key: "visitNo", header: "No. Kunjungan" },
      { key: "patient", header: "Pasien" },
      { key: "medicalRecordNo", header: "No. RM" },
      { key: "doctor", header: "Dokter" },
      { key: "branch", header: "Cabang" },
      { key: "status", header: "Status" },
      { key: "diagnosis", header: "Diagnosis" },
      { key: "visitDate", header: "Tanggal" },
    ]
  );

  return csvResponse(csv, `kunjungan-${new Date().toISOString().slice(0, 10)}.csv`);
}
