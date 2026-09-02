// Integrasi BPJS PCare v2. BUTUH Cons ID + Secret Key resmi dari BPJS Kesehatan
// (pengajuan lewat https://trkendali.bpjs-kesehatan.go.id). BPJS API juga mewajibkan
// signature HMAC-SHA256 per request; di bawah ini kerangka dasarnya saja.
import crypto from "crypto";

function requireConfig() {
  const baseUrl = process.env.BPJS_PCARE_URL;
  const consId = process.env.BPJS_CONS_ID;
  const secretKey = process.env.BPJS_SECRET_KEY;
  const userKey = process.env.BPJS_USER_KEY;

  if (!baseUrl || !consId || !secretKey || !userKey) {
    throw new Error(
      "Integrasi BPJS belum dikonfigurasi. Isi BPJS_PCARE_URL, BPJS_CONS_ID, BPJS_SECRET_KEY, BPJS_USER_KEY di .env.local."
    );
  }
  return { baseUrl, consId, secretKey, userKey };
}

function buildSignatureHeaders(consId: string, secretKey: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(`${consId}&${timestamp}`)
    .digest("base64");
  return { "X-cons-id": consId, "X-timestamp": timestamp, "X-signature": signature };
}

export async function submitKunjungan(payload: {
  noKartu: string;
  tglDaftar: string;
  puskesmasCode: string;
  keluhan: string;
}) {
  const { baseUrl, consId, secretKey, userKey } = requireConfig();
  const res = await fetch(`${baseUrl}/kunjungan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user_key": userKey,
      ...buildSignatureHeaders(consId, secretKey),
    },
    body: JSON.stringify({
      noKartu: payload.noKartu,
      tglDaftar: payload.tglDaftar,
      providerPelayanan: { kdProvider: payload.puskesmasCode },
      keluhan: payload.keluhan,
    }),
  });
  if (!res.ok) throw new Error(`BPJS PCare menolak kunjungan: ${res.status} ${await res.text()}`);
  return res.json();
}
