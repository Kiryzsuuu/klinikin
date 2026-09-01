import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { guard, isError, CLINICAL_ROLES } from "@/lib/guard";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const g = await guard(CLINICAL_ROLES);
  if (isError(g)) return g.error;

  await connectDB();
  const patients = await Patient.find({ isActive: true }).populate("registeredBranchId", "name").sort({ createdAt: -1 });

  const csv = toCsv(
    patients.map((p) => ({
      medicalRecordNo: p.medicalRecordNo,
      name: p.name,
      gender: p.gender,
      phone: p.phone,
      branch: (p.registeredBranchId as unknown as { name?: string })?.name || "",
      createdAt: p.createdAt.toISOString().slice(0, 10),
    })),
    [
      { key: "medicalRecordNo", header: "No. RM" },
      { key: "name", header: "Nama" },
      { key: "gender", header: "Jenis Kelamin" },
      { key: "phone", header: "Telepon" },
      { key: "branch", header: "Cabang" },
      { key: "createdAt", header: "Tanggal Daftar" },
    ]
  );

  return csvResponse(csv, `pasien-${new Date().toISOString().slice(0, 10)}.csv`);
}
