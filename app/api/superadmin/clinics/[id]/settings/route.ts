import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { guard, isError } from "@/lib/guard";
import { ok, fail } from "@/lib/response";
import { clinicSettingsSchema, validateClinicImages, flattenSettings } from "@/lib/clinicSettings";

type Params = { params: Promise<{ id: string }> };

// Super admin bisa mengatur tampilan klinik manapun yang dipilih dari daftar klinik.
export async function PUT(req: NextRequest, { params }: Params) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;

  const { id } = await params;
  const parsed = clinicSettingsSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const imageError = validateClinicImages(parsed.data);
  if (imageError) return fail("INVALID_IMAGE", imageError, 422);

  await connectDB();
  const clinic = await Clinic.findByIdAndUpdate(id, { $set: flattenSettings(parsed.data) }, { new: true });
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);
  return ok(clinic);
}
