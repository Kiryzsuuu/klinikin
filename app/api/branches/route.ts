import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Branch } from "@/models/Branch";
import { guard, isError, MANAGE_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  type: z.enum(["PRATAMA", "UTAMA", "SPESIALIS"]).optional(),
  address: z
    .object({ street: z.string().optional(), city: z.string().optional(), province: z.string().optional(), postalCode: z.string().optional() })
    .optional(),
  contact: z.object({ phone: z.string().optional(), whatsapp: z.string().optional(), email: z.string().optional() }).optional(),
});

// Publik: dipakai form booking & selector cabang
export async function GET() {
  await connectDB();
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
  return ok(branches);
}

export async function POST(req: NextRequest) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const existing = await Branch.findOne({ code: parsed.data.code.toUpperCase() });
  if (existing) return fail("CODE_TAKEN", "Kode cabang sudah digunakan", 409);

  const branch = await Branch.create(parsed.data);
  return ok(branch, { status: 201 });
}
