import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { AccreditationItem } from "@/models/Accreditation";
import { MANAGE_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";
import { isValidBase64Image } from "@/lib/image";

const updateSchema = z.object({
  status: z.enum(["BELUM", "PROSES", "SELESAI"]).optional(),
  note: z.string().optional(),
  evidenceBase64: z.string().optional(),
  evidenceFileName: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  if (parsed.data.evidenceBase64 && !isValidBase64Image(parsed.data.evidenceBase64)) {
    return fail("INVALID_IMAGE", "Format atau ukuran file tidak valid (maks 2MB, gambar saja)", 422);
  }

  await connectDB();
  const item = await AccreditationItem.findOneAndUpdate({ _id: id, ...clinicFilter }, parsed.data, { new: true });
  if (!item) return fail("ITEM_NOT_FOUND", "Item tidak ditemukan", 404);
  return ok(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  const { id } = await params;
  await connectDB();
  const item = await AccreditationItem.findOneAndDelete({ _id: id, ...clinicFilter });
  if (!item) return fail("ITEM_NOT_FOUND", "Item tidak ditemukan", 404);
  return ok({ message: "Item dihapus" });
}
