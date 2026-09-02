import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";
import { guard, isError } from "@/lib/guard";
import { ok, fail } from "@/lib/response";
import { getSession } from "@/lib/auth";
import { FEATURE_KEY_VALUES } from "@/lib/features";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  priceMonthly: z.number().min(0),
  maxBranches: z.number().min(1),
  maxUsers: z.number().min(1),
  features: z.array(z.enum(FEATURE_KEY_VALUES)).default([]),
});

// GET publik: dipakai halaman pricing landing page & billing klinik (hanya paket aktif).
// Super admin yang login melihat semua paket termasuk yang nonaktif, untuk keperluan kelola paket.
export async function GET() {
  await connectDB();
  const session = await getSession();
  const filter = session?.role === "SUPER_ADMIN" ? {} : { isActive: true };
  const plans = await SubscriptionPlan.find(filter).sort({ priceMonthly: 1 });
  return ok(plans);
}

export async function POST(req: NextRequest) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const existing = await SubscriptionPlan.findOne({ slug: parsed.data.slug });
  if (existing) return fail("SLUG_TAKEN", "Slug paket sudah digunakan", 409);

  const plan = await SubscriptionPlan.create(parsed.data);
  return ok(plan, { status: 201 });
}
