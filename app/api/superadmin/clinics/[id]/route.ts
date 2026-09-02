import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Clinic, SUBSCRIPTION_STATUSES } from "@/models/Clinic";
import { User } from "@/models/User";
import { Branch } from "@/models/Branch";
import { Payment } from "@/models/Payment";
import { guard, isError } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  planId: z.string().nullable().optional(),
  currentPeriodEnd: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;

  const { id } = await params;
  await connectDB();

  const clinic = await Clinic.findById(id);
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);

  const [users, branches, payments] = await Promise.all([
    User.find({ clinicId: id }).select("-passwordHash -mfaSecret -mfaPendingSecret"),
    Branch.find({ clinicId: id }),
    Payment.find({ clinicId: id }).sort({ createdAt: -1 }).limit(20),
  ]);

  return ok({ clinic, users, branches, payments });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const update: Record<string, unknown> = {};
  if (parsed.data.isActive !== undefined) update.isActive = parsed.data.isActive;
  if (parsed.data.status !== undefined) update["subscription.status"] = parsed.data.status;
  if (parsed.data.planId !== undefined) update["subscription.planId"] = parsed.data.planId;
  if (parsed.data.currentPeriodEnd !== undefined)
    update["subscription.currentPeriodEnd"] = new Date(parsed.data.currentPeriodEnd);

  const clinic = await Clinic.findByIdAndUpdate(id, update, { new: true });
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);
  return ok(clinic);
}
