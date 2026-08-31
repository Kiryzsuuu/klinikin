import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signSession } from "@/lib/jwt";
import { ok, fail } from "@/lib/response";
import { SESSION_COOKIE } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Email/password wajib diisi", 422);

  const { email, password } = parsed.data;
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) return fail("INVALID_CREDENTIALS", "Email atau password salah", 401);
  if (!user.isActive) return fail("USER_INACTIVE", "Akun Anda tidak aktif, hubungi admin", 403);
  if (!user.isEmailVerified) return fail("EMAIL_NOT_VERIFIED", "Email belum diverifikasi", 403);

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return fail("INVALID_CREDENTIALS", "Email atau password salah", 401);

  user.lastLogin = new Date();
  await user.save();

  const token = signSession({ userId: user._id.toString(), email: user.email, role: user.role });

  const res = ok({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      photoBase64: user.photoBase64,
    },
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
