import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Supplier } from "@/models/Procurement";
import { PHARMACY_ROLES } from "@/lib/guard";
import { scopedGuard, isError, requireFeature } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

export async function GET() {
  const g = await scopedGuard(PHARMACY_ROLES);
  if (isError(g)) return g.error;
  const { session: sessionGet, clinicFilter } = g;
  const featureErrorGet = await requireFeature(sessionGet, "procurement");
  if (featureErrorGet) return featureErrorGet;

  await connectDB();
  const suppliers = await Supplier.find({ isActive: true, ...clinicFilter }).sort({ name: 1 });
  return ok(suppliers);
}

export async function POST(req: NextRequest) {
  const g = await scopedGuard(PHARMACY_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;
  const featureError = await requireFeature(session, "procurement");
  if (featureError) return featureError;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const supplier = await Supplier.create({ ...parsed.data, clinicId: session.clinicId });
  return ok(supplier, { status: 201 });
}
