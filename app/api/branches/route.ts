import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Branch } from "@/models/Branch";
import { Clinic } from "@/models/Clinic";
import { getSession } from "@/lib/auth";
import { scopedGuard, isError, TRIAL_LIMITS } from "@/lib/tenant";
import { MANAGE_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  type: z.enum(["PRATAMA", "UTAMA", "SPESIALIS"]).optional(),
  address: z
    .object({ street: z.string().optional(), city: z.string().optional(), province: z.string().optional(), postalCode: z.string().optional() })
    .optional(),
  contact: z.object({ phone: z.string().optional(), whatsapp: z.string().optional(), email: z.string().optional() }).optional(),
});

// Publik (dipakai form booking per-klinik via /c/[slug]/booking, butuh ?clinicId=)
// atau terautentikasi (dashboard admin, otomatis di-scope ke klinik sesi).
export async function GET(req: NextRequest) {
  await connectDB();
  const session = await getSession();

  let clinicId: string | undefined;
  if (session) {
    clinicId = session.role === "SUPER_ADMIN" ? undefined : session.clinicId ?? undefined;
  } else {
    clinicId = req.nextUrl.searchParams.get("clinicId") ?? undefined;
    if (!clinicId) return fail("CLINIC_REQUIRED", "clinicId wajib diisi", 400);
  }

  const filter: Record<string, unknown> = { isActive: true };
  if (clinicId) filter.clinicId = clinicId;

  const branches = await Branch.find(filter).sort({ name: 1 });
  return ok(branches);
}

export async function POST(req: NextRequest) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();

  if (session.role !== "SUPER_ADMIN") {
    const clinic = await Clinic.findById(session.clinicId);
    if (clinic?.subscription?.status === "TRIAL") {
      const count = await Branch.countDocuments({ clinicId: session.clinicId });
      if (count >= TRIAL_LIMITS.maxBranches) {
        return fail(
          "TRIAL_LIMIT_REACHED",
          `Masa trial dibatasi maksimal ${TRIAL_LIMITS.maxBranches} cabang. Upgrade paket untuk menambah cabang.`,
          403
        );
      }
    }
  }

  const existing = await Branch.findOne({ clinicId: session.clinicId, code: parsed.data.code.toUpperCase() });
  if (existing) return fail("CODE_TAKEN", "Kode cabang sudah digunakan", 409);

  const branch = await Branch.create({ ...parsed.data, clinicId: session.clinicId });
  return ok(branch, { status: 201 });
}
