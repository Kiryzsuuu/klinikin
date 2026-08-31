import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { InsuranceClaim } from "@/models/Insurance";
import { guard, isError, CASHIER_ROLES } from "@/lib/guard";
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
  const g = await guard(CASHIER_ROLES);
  if (isError(g)) return g.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const claims = await InsuranceClaim.find(filter)
    .populate("patientId", "name medicalRecordNo")
    .populate("providerId", "name")
    .populate("branchId", "name")
    .sort({ createdAt: -1 });

  return ok(claims);
}

export async function POST(req: NextRequest) {
  const g = await guard(CASHIER_ROLES);
  if (isError(g)) return g.error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const claim = await InsuranceClaim.create({ ...parsed.data, submittedBy: g.session.userId });
  return ok(claim, { status: 201 });
}
