import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Medicine } from "@/models/Medicine";
import { PHARMACY_ROLES } from "@/lib/guard";
import { scopedGuard, isError, requireFeature } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  branchId: z.string(),
  name: z.string().min(2),
  genericName: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  stock: z.object({ current: z.number().min(0), minimum: z.number().min(0) }).optional(),
  pricing: z.object({ buyPrice: z.number().min(0), sellPrice: z.number().min(0) }).optional(),
});

export async function GET(req: NextRequest) {
  const g = await scopedGuard(PHARMACY_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;
  const featureError = await requireFeature(session, "pharmacy");
  if (featureError) return featureError;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const q = searchParams.get("q") || "";
  const lowStock = searchParams.get("lowStock") === "true";

  const filter: Record<string, unknown> = { ...clinicFilter };
  if (branchId) filter.branchId = branchId;
  if (q) filter.name = { $regex: q, $options: "i" };

  let items = await Medicine.find(filter).populate("branchId", "name code").sort({ name: 1 });
  if (lowStock) items = items.filter((m) => m.stock.current <= m.stock.minimum);

  return ok(items);
}

export async function POST(req: NextRequest) {
  const g = await scopedGuard(PHARMACY_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;
  const featureError = await requireFeature(session, "pharmacy");
  if (featureError) return featureError;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const medicine = await Medicine.create({ ...parsed.data, clinicId: session.clinicId });
  return ok(medicine, { status: 201 });
}
