import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { guard, isError, MANAGE_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";
import { audit } from "@/lib/audit";
import { CONFIGURABLE_ROLES, DEFAULT_ROLE_FEATURES, FEATURE_KEY_VALUES } from "@/lib/features";

// Akses fitur per role staf dalam klinik yang login: hanya OWNER/ADMIN_PUSAT klinik itu sendiri
// yang boleh mengatur (bukan lintas klinik, beda dari paket langganan yang diatur super admin).
const updateSchema = z.object(
  Object.fromEntries(CONFIGURABLE_ROLES.map((r) => [r, z.array(z.enum(FEATURE_KEY_VALUES)).optional()]))
);

export async function GET() {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;
  if (!session.clinicId) return fail("NO_CLINIC", "Akun ini tidak terhubung ke klinik manapun", 400);

  await connectDB();
  const clinic = await Clinic.findById(session.clinicId).select("rolePermissions");
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);

  const stored = (clinic.rolePermissions || {}) as Record<string, string[]>;
  const effective: Record<string, string[]> = {};
  for (const role of CONFIGURABLE_ROLES) {
    effective[role] = stored[role] ?? DEFAULT_ROLE_FEATURES[role];
  }

  return ok(effective);
}

export async function PUT(req: NextRequest) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;
  if (!session.clinicId) return fail("NO_CLINIC", "Akun ini tidak terhubung ke klinik manapun", 400);

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const clinic = await Clinic.findByIdAndUpdate(
    session.clinicId,
    { $set: { rolePermissions: parsed.data } },
    { new: true }
  ).select("rolePermissions");
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);

  await audit(session, "ROLE_PERMISSIONS_UPDATE", "Clinic", session.clinicId, req, { roles: Object.keys(parsed.data) });
  return ok(clinic.rolePermissions);
}
