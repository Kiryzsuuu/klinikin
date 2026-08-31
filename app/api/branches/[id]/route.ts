import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Branch } from "@/models/Branch";
import { guard, isError, MANAGE_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(["PRATAMA", "UTAMA", "SPESIALIS"]).optional(),
  address: z.object({}).passthrough().optional(),
  contact: z.object({}).passthrough().optional(),
  operationalHours: z.object({}).passthrough().optional(),
  bpjsInfo: z.object({}).passthrough().optional(),
  satuSehatInfo: z.object({}).passthrough().optional(),
  isActive: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const branch = await Branch.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!branch) return fail("BRANCH_NOT_FOUND", "Cabang tidak ditemukan", 404);
  return ok(branch);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;

  const { id } = await params;
  await connectDB();
  const branch = await Branch.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!branch) return fail("BRANCH_NOT_FOUND", "Cabang tidak ditemukan", 404);
  return ok({ message: "Cabang dinonaktifkan" });
}
