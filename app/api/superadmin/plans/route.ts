import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";
import { guard, isError } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  priceMonthly: z.number().min(0),
  maxBranches: z.number().min(1),
  maxUsers: z.number().min(1),
  features: z.array(z.string()).default([]),
});

// GET publik: dipakai halaman pricing landing page & billing klinik
export async function GET() {
  await connectDB();
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ priceMonthly: 1 });
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
