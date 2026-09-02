import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { InsuranceProvider } from "@/models/Insurance";
import { MANAGE_ROLES, CASHIER_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  claimPortalUrl: z.string().optional(),
});

export async function GET() {
  const g = await scopedGuard(CASHIER_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  await connectDB();
  const providers = await InsuranceProvider.find({ isActive: true, ...clinicFilter }).sort({ name: 1 });
  return ok(providers);
}

export async function POST(req: NextRequest) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const existing = await InsuranceProvider.findOne({ name: parsed.data.name, ...clinicFilter });
  if (existing) return fail("NAME_TAKEN", "Provider sudah terdaftar", 409);

  const provider = await InsuranceProvider.create({ ...parsed.data, clinicId: session.clinicId });
  return ok(provider, { status: 201 });
}
