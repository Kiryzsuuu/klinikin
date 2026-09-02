import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { AccreditationItem } from "@/models/Accreditation";
import { MANAGE_ROLES } from "@/lib/guard";
import { scopedGuard, isError, requireFeature } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  branchId: z.string(),
  category: z.string().min(2),
  item: z.string().min(2),
});

export async function GET(req: NextRequest) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;
  const featureError = await requireFeature(session, "accreditation");
  if (featureError) return featureError;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const filter: Record<string, unknown> = { ...clinicFilter };
  if (branchId) filter.branchId = branchId;

  const items = await AccreditationItem.find(filter).populate("branchId", "name").sort({ category: 1 });
  return ok(items);
}

export async function POST(req: NextRequest) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;
  const featureError = await requireFeature(session, "accreditation");
  if (featureError) return featureError;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const item = await AccreditationItem.create({ ...parsed.data, clinicId: session.clinicId });
  return ok(item, { status: 201 });
}
