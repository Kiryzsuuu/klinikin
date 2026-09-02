import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { guard, isError, MANAGE_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";
import { clinicSettingsSchema, validateClinicImages, flattenSettings } from "@/lib/clinicSettings";

// Pengaturan tampilan klinik sendiri (bukan platform): dibaca/diubah oleh
// OWNER/ADMIN_PUSAT klinik yang login, otomatis di-scope ke klinik mereka sendiri.
export async function GET() {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;
  if (!session.clinicId) return fail("NO_CLINIC", "Akun ini tidak terhubung ke klinik manapun", 400);

  await connectDB();
  const clinic = await Clinic.findById(session.clinicId);
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);
  return ok(clinic);
}

export async function PUT(req: NextRequest) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;
  if (!session.clinicId) return fail("NO_CLINIC", "Akun ini tidak terhubung ke klinik manapun", 400);

  const parsed = clinicSettingsSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const imageError = validateClinicImages(parsed.data);
  if (imageError) return fail("INVALID_IMAGE", imageError, 422);

  await connectDB();
  const clinic = await Clinic.findByIdAndUpdate(
    session.clinicId,
    { $set: flattenSettings(parsed.data) },
    { new: true }
  );
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);
  return ok(clinic);
}
