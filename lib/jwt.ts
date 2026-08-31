import jwt from "jsonwebtoken";

export type SessionPayload = {
  userId: string;
  email: string;
  role: string;
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
