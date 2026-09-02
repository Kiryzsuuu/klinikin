// Pembayaran langganan via Midtrans Snap (https://dashboard.midtrans.com).
// BUTUH MIDTRANS_SERVER_KEY & MIDTRANS_CLIENT_KEY di .env.local sebelum bisa dipakai.

import crypto from "crypto";
import midtransClient from "midtrans-client";

type ClinicLike = { _id: unknown; name: string; ownerEmail: string };
type PlanLike = { _id: unknown; name: string; priceMonthly: number };

function requireKeys() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  if (!serverKey || !clientKey) {
    throw new Error(
      "MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY belum diisi di .env.local. Ambil dari dashboard.midtrans.com/settings/config_info."
    );
  }
  return { serverKey, clientKey };
}

function getSnapClient() {
  const { serverKey, clientKey } = requireKeys();
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey,
    clientKey,
  });
}

export function buildOrderId(clinicId: string) {
  return `KK-${clinicId}-${Date.now()}`;
}

export async function createSnapTransaction(clinic: ClinicLike, plan: PlanLike, orderId: string) {
  const snap = getSnapClient();
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: plan.priceMonthly,
    },
    item_details: [
      {
        id: String(plan._id),
        price: plan.priceMonthly,
        quantity: 1,
        name: `Langganan KlinikKita, Paket ${plan.name} (1 bulan)`,
      },
    ],
    customer_details: {
      first_name: clinic.name,
      email: clinic.ownerEmail,
    },
  };

  const transaction = await snap.createTransaction(parameter);
  return transaction as { token: string; redirect_url: string };
}

// Verifikasi signature notifikasi Midtrans (SHA512 order_id+status_code+gross_amount+server_key).
export function verifyNotificationSignature(body: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) {
  const { serverKey } = requireKeys();
  const expected = crypto
    .createHash("sha512")
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`)
    .digest("hex");
  return expected === body.signature_key;
}
