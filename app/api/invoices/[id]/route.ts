import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { CASHIER_ROLES } from "@/lib/guard";
import { scopedGuard, isError, requireFeature } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const paySchema = z.object({
  status: z.enum(["UNPAID", "PAID", "PARTIAL", "REFUNDED"]),
  paidAmount: z.number().min(0).optional(),
  method: z.enum(["CASH", "TRANSFER", "QRIS", "BPJS", "INSURANCE"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const g = await scopedGuard(CASHIER_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;
  const featureError = await requireFeature(session, "cashier");
  if (featureError) return featureError;

  const { id } = await params;
  await connectDB();
  const invoice = await Invoice.findOne({ _id: id, ...clinicFilter }).populate("patientId").populate("branchId", "name code");
  if (!invoice) return fail("INVOICE_NOT_FOUND", "Invoice tidak ditemukan", 404);
  return ok(invoice);
}

// Update status pembayaran (bayar tunai/QRIS/dll)
export async function PUT(req: NextRequest, { params }: Params) {
  const g = await scopedGuard(CASHIER_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;
  const featureError = await requireFeature(session, "cashier");
  if (featureError) return featureError;

  const { id } = await params;
  const parsed = paySchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  await connectDB();
  const update: Record<string, unknown> = {
    "payment.status": parsed.data.status,
  };
  if (parsed.data.paidAmount !== undefined) update["payment.paidAmount"] = parsed.data.paidAmount;
  if (parsed.data.method) update["payment.method"] = parsed.data.method;
  if (parsed.data.status === "PAID") update["payment.paidAt"] = new Date();

  const invoice = await Invoice.findOneAndUpdate({ _id: id, ...clinicFilter }, { $set: update }, { new: true });
  if (!invoice) return fail("INVOICE_NOT_FOUND", "Invoice tidak ditemukan", 404);
  return ok(invoice);
}
