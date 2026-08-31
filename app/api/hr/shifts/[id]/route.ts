import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Shift } from "@/models/Shift";
import { guard, isError, MANAGE_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;

  const { id } = await params;
  await connectDB();
  const shift = await Shift.findByIdAndDelete(id);
  if (!shift) return fail("SHIFT_NOT_FOUND", "Jadwal tidak ditemukan", 404);
  return ok({ message: "Jadwal dihapus" });
}
