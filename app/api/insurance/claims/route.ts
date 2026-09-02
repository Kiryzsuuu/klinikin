import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { InsuranceClaim } from "@/models/Insurance";
import { CASHIER_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  branchId: z.string(),
  patientId: z.string(),
  invoiceId: z.string().optional(),
  providerId: z.string(),
  policyNo: z.string().optional(),
  claimAmount: z.number().positive(),
});

export async function GET(req: NextRequest) {
  const g = await scopedGuard(CASHIER_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const filter: Record<string, unknown> = { ...clinicFilter };
  if (status) filter.status = status;

  const claims = await InsuranceClaim.find(filter)
    .populate("patientId", "name medicalRecordNo")
    .populate("providerId", "name")
    .populate("branchId", "name")
    .sort({ createdAt: -1 });

  return ok(claims);
}

export async function POST(req: NextRequest) {
  const g = await scopedGuard(CASHIER_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const claim = await InsuranceClaim.create({ ...parsed.data, submittedBy: session.userId, clinicId: session.clinicId });
  return ok(claim, { status: 201 });
}
