import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { LabOrder } from "@/models/LabOrder";
import { CLINICAL_ROLES } from "@/lib/guard";
import { scopedGuard, isError, requireFeature } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  branchId: z.string(),
  patientId: z.string(),
  visitId: z.string().optional(),
  category: z.enum(["LAB", "RADIOLOGI"]),
  testName: z.string().min(2),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;
  const featureError = await requireFeature(session, "lab");
  if (featureError) return featureError;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const branchId = searchParams.get("branchId");
  const status = searchParams.get("status");

  const filter: Record<string, unknown> = { ...clinicFilter };
  if (patientId) filter.patientId = patientId;
  if (branchId) filter.branchId = branchId;
  if (status) filter.status = status;

  const orders = await LabOrder.find(filter)
    .populate("patientId", "name medicalRecordNo")
    .populate("branchId", "name")
    .sort({ createdAt: -1 });

  return ok(orders);
}

export async function POST(req: NextRequest) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;
  const featureError = await requireFeature(session, "lab");
  if (featureError) return featureError;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const order = await LabOrder.create({ ...parsed.data, requestedBy: session.userId, clinicId: session.clinicId });
  return ok(order, { status: 201 });
}
