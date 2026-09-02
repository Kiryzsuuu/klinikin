import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Shift } from "@/models/Shift";
import { MANAGE_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  userId: z.string(),
  branchId: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const userId = searchParams.get("userId");

  const filter: Record<string, unknown> = { ...clinicFilter };
  if (branchId) filter.branchId = branchId;
  if (userId) filter.userId = userId;

  const shifts = await Shift.find(filter)
    .populate("userId", "name role")
    .populate("branchId", "name code")
    .sort({ dayOfWeek: 1, startTime: 1 });

  return ok(shifts);
}

export async function POST(req: NextRequest) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const shift = await Shift.create({ ...parsed.data, clinicId: session.clinicId });
  return ok(shift, { status: 201 });
}
