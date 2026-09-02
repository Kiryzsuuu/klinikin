import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signSession, verifyMfaPendingToken } from "@/lib/jwt";
import { verifyTotpToken } from "@/lib/totp";
import { SESSION_COOKIE } from "@/lib/auth";
import { ok, fail } from "@/lib/response";

const schema = z.object({ mfaToken: z.string(), code: z.string().min(6).max(6) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  const payload = verifyMfaPendingToken(parsed.data.mfaToken);
  if (!payload) return fail("MFA_TOKEN_EXPIRED", "Sesi login kedaluwarsa, silakan login ulang", 401);

  await connectDB();
  const user = await User.findById(payload.userId);
  if (!user || !user.mfaEnabled) return fail("MFA_NOT_ENABLED", "MFA tidak aktif untuk akun ini", 400);

  const valid = verifyTotpToken(user.email, user.mfaSecret, parsed.data.code);
  if (!valid) return fail("INVALID_CODE", "Kode MFA salah", 401);

  user.lastLogin = new Date();
  await user.save();

  const token = signSession({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    clinicId: user.clinicId ? String(user.clinicId) : null,
  });
  const res = ok({
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role, photoBase64: user.photoBase64 },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
