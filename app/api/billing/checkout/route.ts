import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";
import { Payment } from "@/models/Payment";
import { guard, isError, MANAGE_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";
import { buildOrderId, createSnapTransaction } from "@/lib/integrations/midtrans";

const schema = z.object({ planId: z.string() });

export async function POST(req: NextRequest) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;

  if (!session.clinicId) return fail("NO_CLINIC", "Akun ini tidak terhubung ke klinik manapun", 400);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "planId wajib diisi", 422);

  await connectDB();

  const [clinic, plan] = await Promise.all([
    Clinic.findById(session.clinicId),
    SubscriptionPlan.findById(parsed.data.planId),
  ]);
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);
  if (!plan || !plan.isActive) return fail("PLAN_NOT_FOUND", "Paket tidak ditemukan", 404);

  const orderId = buildOrderId(String(clinic._id));

  let transaction: { token: string; redirect_url: string };
  try {
    transaction = await createSnapTransaction(clinic, plan, orderId);
  } catch (err) {
    return fail(
      "MIDTRANS_ERROR",
      "Pembayaran belum bisa diproses. Server key Midtrans belum dikonfigurasi.",
      500,
      err instanceof Error ? err.message : undefined
    );
  }

  await Payment.create({
    clinicId: clinic._id,
    planId: plan._id,
    orderId,
    amount: plan.priceMonthly,
    status: "PENDING",
  });

  return ok({ token: transaction.token, redirectUrl: transaction.redirect_url });
}
