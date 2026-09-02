import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { Clinic } from "@/models/Clinic";
import { ok, fail } from "@/lib/response";
import { verifyNotificationSignature } from "@/lib/integrations/midtrans";

// Dipanggil oleh server Midtrans (bukan browser): atur URL ini sebagai
// "Payment Notification URL" di dashboard.midtrans.com/settings/config_info.
export async function POST(req: NextRequest) {
  const body = await req.json();

  const validSignature = verifyNotificationSignature({
    order_id: body.order_id,
    status_code: body.status_code,
    gross_amount: body.gross_amount,
    signature_key: body.signature_key,
  });
  if (!validSignature) return fail("INVALID_SIGNATURE", "Signature tidak valid", 403);

  await connectDB();
  const payment = await Payment.findOne({ orderId: body.order_id });
  if (!payment) return fail("PAYMENT_NOT_FOUND", "Order tidak ditemukan", 404);

  const status = body.transaction_status as string;
  payment.rawNotification = body;
  payment.midtransTransactionId = body.transaction_id || "";

  if (status === "settlement" || status === "capture") {
    payment.status = "SUCCESS";
    payment.paidAt = new Date();
    await payment.save();

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await Clinic.findByIdAndUpdate(payment.clinicId, {
      "subscription.status": "ACTIVE",
      "subscription.planId": payment.planId,
      "subscription.currentPeriodEnd": periodEnd,
    });
  } else if (status === "pending") {
    payment.status = "PENDING";
    await payment.save();
  } else if (status === "expire") {
    payment.status = "EXPIRED";
    await payment.save();
  } else {
    payment.status = "FAILED";
    await payment.save();
  }

  return ok({ received: true });
}
