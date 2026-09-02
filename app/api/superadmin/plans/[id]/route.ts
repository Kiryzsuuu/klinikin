import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";
import { guard, isError } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  priceMonthly: z.number().min(0).optional(),
  maxBranches: z.number().min(1).optional(),
  maxUsers: z.number().min(1).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const plan = await SubscriptionPlan.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!plan) return fail("PLAN_NOT_FOUND", "Paket tidak ditemukan", 404);
  return ok(plan);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;

  const { id } = await params;
  await connectDB();
  const plan = await SubscriptionPlan.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!plan) return fail("PLAN_NOT_FOUND", "Paket tidak ditemukan", 404);
  return ok({ message: "Paket dinonaktifkan" });
}
