import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Shift } from "@/models/Shift";
import { MANAGE_ROLES } from "@/lib/guard";
import { scopedGuard, isError, requireFeature } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;
  const featureError = await requireFeature(session, "hr");
  if (featureError) return featureError;

  const { id } = await params;
  await connectDB();
  const shift = await Shift.findOneAndDelete({ _id: id, ...clinicFilter });
  if (!shift) return fail("SHIFT_NOT_FOUND", "Jadwal tidak ditemukan", 404);
  return ok({ message: "Jadwal dihapus" });
}
