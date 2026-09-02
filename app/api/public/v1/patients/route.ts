import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { verifyApiKey } from "@/lib/apiKeyAuth";
import { ok, fail } from "@/lib/response";

// API publik untuk integrasi pihak ketiga. Auth: header `X-API-Key`.
// Field sensitif (NIK, insurance memberNo) sengaja tidak diekspos.
export async function GET(req: NextRequest) {
  await connectDB();
  const check = await verifyApiKey(req.headers.get("x-api-key"), "patients:read");
  if (!check.ok) return fail("UNAUTHORIZED", check.message, check.status);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 20));

  const [items, total] = await Promise.all([
    Patient.find({ clinicId: check.clinicId, isActive: true })
      .select("medicalRecordNo name gender registeredBranchId createdAt")
      .populate("registeredBranchId", "name code")
      .skip((page - 1) * limit)
      .limit(limit),
    Patient.countDocuments({ clinicId: check.clinicId, isActive: true }),
  ]);

  return ok(items, { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
