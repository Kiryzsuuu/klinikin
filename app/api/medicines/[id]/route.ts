import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Medicine } from "@/models/Medicine";
import { PHARMACY_ROLES } from "@/lib/guard";
import { scopedGuard, isError, requireFeature } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const updateSchema = z.object({}).passthrough();

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const g = await scopedGuard(PHARMACY_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;
  const featureError = await requireFeature(session, "pharmacy");
  if (featureError) return featureError;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  await connectDB();
  const medicine = await Medicine.findOneAndUpdate({ _id: id, ...clinicFilter }, parsed.data, { new: true });
  if (!medicine) return fail("MEDICINE_NOT_FOUND", "Obat tidak ditemukan", 404);
  return ok(medicine);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await scopedGuard(PHARMACY_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;
  const featureError = await requireFeature(session, "pharmacy");
  if (featureError) return featureError;

  const { id } = await params;
  await connectDB();
  const medicine = await Medicine.findOneAndDelete({ _id: id, ...clinicFilter });
  if (!medicine) return fail("MEDICINE_NOT_FOUND", "Obat tidak ditemukan", 404);
  return ok({ message: "Obat dihapus" });
}
