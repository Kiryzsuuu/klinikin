import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Patient, generateMedicalRecordNo } from "@/models/Patient";
import { CLINICAL_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";
import { isValidBase64Image } from "@/lib/image";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  registeredBranchId: z.string(),
  name: z.string().min(2),
  nik: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["L", "P"]).optional(),
  bloodType: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  photoBase64: z.string().optional(),
  insurance: z.object({ type: z.enum(["UMUM", "BPJS", "ASURANSI_SWASTA"]).optional(), memberNo: z.string().optional(), provider: z.string().optional() }).optional(),
});

export async function GET(req: NextRequest) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 20));
  const q = searchParams.get("q") || "";

  const filter: Record<string, unknown> = q
    ? { ...clinicFilter, $or: [{ name: { $regex: q, $options: "i" } }, { medicalRecordNo: { $regex: q, $options: "i" } }, { nik: { $regex: q, $options: "i" } }] }
    : { ...clinicFilter };

  const [items, total] = await Promise.all([
    Patient.find(filter)
      .populate("registeredBranchId", "name code")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Patient.countDocuments(filter),
  ]);

  return ok(items, { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  if (parsed.data.photoBase64 && !isValidBase64Image(parsed.data.photoBase64)) {
    return fail("INVALID_IMAGE", "Format atau ukuran gambar tidak valid (maks 2MB)", 422);
  }
  if (!session.clinicId) return fail("CLINIC_REQUIRED", "Akun ini tidak terhubung ke klinik", 400);

  await connectDB();
  const medicalRecordNo = await generateMedicalRecordNo(session.clinicId);
  const patient = await Patient.create({ ...parsed.data, medicalRecordNo, clinicId: session.clinicId });
  await audit(session, "PATIENT_CREATE", "Patient", String(patient._id), req);
  return ok(patient, { status: 201 });
}
