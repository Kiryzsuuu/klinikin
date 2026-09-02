import jwt from "jsonwebtoken";

export type SessionPayload = {
  userId: string;
  email: string;
  role: string;
  clinicId: string | null;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET belum diisi di .env.local");
  return secret;
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: (process.env.JWT_EXPIRES || "7d") as jwt.SignOptions["expiresIn"],
  });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export type MfaPendingPayload = { userId: string; mfaPending: true };

// Token sementara (5 menit) dipakai antara "password benar" dan "kode MFA terverifikasi" —
// dikirim di response body, bukan cookie, sampai MFA lolos baru session cookie diterbitkan.
export function signMfaPendingToken(userId: string) {
  return jwt.sign({ userId, mfaPending: true } satisfies MfaPendingPayload, getSecret(), { expiresIn: "5m" });
}

export function verifyMfaPendingToken(token: string): MfaPendingPayload | null {
  try {
    const payload = jwt.verify(token, getSecret()) as MfaPendingPayload;
    return payload.mfaPending ? payload : null;
  } catch {
    return null;
  }
}
