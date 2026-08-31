import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { InsuranceClaim } from "@/models/Insurance";
import { guard, isError, CASHIER_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const updateSchema = z.object({
  status: z.enum(["SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "PAID"]),
  note: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const g = await guard(CASHIER_ROLES);
  if (isError(g)) return g.error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  await connectDB();
  const claim = await InsuranceClaim.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!claim) return fail("CLAIM_NOT_FOUND", "Klaim tidak ditemukan", 404);
  return ok(claim);
}
