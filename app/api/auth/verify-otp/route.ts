import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyOtp } from "@/lib/otp";
import { signSession } from "@/lib/jwt";
import { ok, fail } from "@/lib/response";
import { SESSION_COOKIE } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  purpose: z.enum(["REGISTER", "LOGIN", "RESET_PASSWORD"]),
});

const REASON_MESSAGE: Record<string, string> = {
  OTP_NOT_FOUND: "Kode OTP tidak ditemukan, silakan minta kode baru.",
  OTP_EXPIRED: "Kode OTP sudah kedaluwarsa, silakan minta kode baru.",
  OTP_LOCKED: "Terlalu banyak percobaan salah, silakan minta kode baru.",
  OTP_INVALID: "Kode OTP salah.",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  const { email, code, purpose } = parsed.data;
  await connectDB();

  const result = await verifyOtp(email, purpose, code);
  if (!result.ok) {
    return fail(result.reason, REASON_MESSAGE[result.reason] ?? "OTP tidak valid", 400);
  }

  if (purpose === "REGISTER") {
    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true, lastLogin: new Date() },
      { new: true }
    );
    if (!user) return fail("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);

    const token = signSession({ userId: user._id.toString(), email: user.email, role: user.role });
    const res = ok({ user: sanitizeUser(user) });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return res;
  }

  // RESET_PASSWORD: hanya konfirmasi OTP valid, penggantian password dilakukan di endpoint reset-password
  return ok({ verified: true });
}

function sanitizeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  photoBase64: string;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    photoBase64: user.photoBase64,
  };
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
