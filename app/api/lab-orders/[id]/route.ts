import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { LabOrder } from "@/models/LabOrder";
import { guard, isError, CLINICAL_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";
import { isValidBase64Image } from "@/lib/image";

const updateSchema = z.object({
  status: z.enum(["REQUESTED", "PROCESSING", "DONE", "CANCELLED"]).optional(),
  resultText: z.string().optional(),
  resultFileBase64: z.string().optional(),
  resultFileName: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const g = await guard(CLINICAL_ROLES);
  if (isError(g)) return g.error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  if (parsed.data.resultFileBase64 && !isValidBase64Image(parsed.data.resultFileBase64)) {
    return fail("INVALID_IMAGE", "Format atau ukuran file tidak valid (maks 2MB, gambar saja)", 422);
  }

  await connectDB();
  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "DONE") update.completedAt = new Date();

  const order = await LabOrder.findByIdAndUpdate(id, update, { new: true });
  if (!order) return fail("ORDER_NOT_FOUND", "Order tidak ditemukan", 404);
  return ok(order);
}
