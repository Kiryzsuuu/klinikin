import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { InsuranceProvider } from "@/models/Insurance";
import { guard, isError, MANAGE_ROLES, CASHIER_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  claimPortalUrl: z.string().optional(),
});

export async function GET() {
  const g = await guard(CASHIER_ROLES);
  if (isError(g)) return g.error;

  await connectDB();
  const providers = await InsuranceProvider.find({ isActive: true }).sort({ name: 1 });
  return ok(providers);
}

export async function POST(req: NextRequest) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const existing = await InsuranceProvider.findOne({ name: parsed.data.name });
  if (existing) return fail("NAME_TAKEN", "Provider sudah terdaftar", 409);

  const provider = await InsuranceProvider.create(parsed.data);
  return ok(provider, { status: 201 });
}
