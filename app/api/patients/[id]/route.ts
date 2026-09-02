import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { CLINICAL_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";
import { isValidBase64Image } from "@/lib/image";
import { audit } from "@/lib/audit";

const updateSchema = z.object({}).passthrough();

type Params = { params: Promise<{ id: string }> };

// Detail pasien + riwayat kunjungan lintas cabang (inti RME)
export async function GET(req: NextRequest, { params }: Params) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;

  const { id } = await params;
  await connectDB();
  const [patient, visits] = await Promise.all([
    Patient.findOne({ _id: id, ...clinicFilter }).populate("registeredBranchId", "name code"),
    Visit.find({ patientId: id, ...clinicFilter })
      .populate("branchId", "name code")
      .populate("doctorId", "name")
      .sort({ visitDate: -1 }),
  ]);
  if (!patient) return fail("PATIENT_NOT_FOUND", "Pasien tidak ditemukan", 404);

  await audit(session, "PATIENT_VIEW", "Patient", id, req);
  return ok({ patient, visits });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  const data = parsed.data as { photoBase64?: string };
  if (data.photoBase64 && !isValidBase64Image(data.photoBase64)) {
    return fail("INVALID_IMAGE", "Format atau ukuran gambar tidak valid (maks 2MB)", 422);
  }

  await connectDB();
  const patient = await Patient.findOneAndUpdate({ _id: id, ...clinicFilter }, data, { new: true });
  if (!patient) return fail("PATIENT_NOT_FOUND", "Pasien tidak ditemukan", 404);
  await audit(session, "PATIENT_UPDATE", "Patient", id, req, { fields: Object.keys(data) });
  return ok(patient);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;

  const { id } = await params;
  await connectDB();
  const patient = await Patient.findOneAndUpdate({ _id: id, ...clinicFilter }, { isActive: false }, { new: true });
  if (!patient) return fail("PATIENT_NOT_FOUND", "Pasien tidak ditemukan", 404);
  await audit(session, "PATIENT_DEACTIVATE", "Patient", id, req);
  return ok({ message: "Pasien dinonaktifkan" });
}
