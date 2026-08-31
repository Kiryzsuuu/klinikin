import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyOtp } from "@/lib/otp";
import { ok, fail } from "@/lib/response";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  const { email, code, newPassword } = parsed.data;
  await connectDB();

  const result = await verifyOtp(email, "RESET_PASSWORD", code);
  if (!result.ok) return fail(result.reason, "Kode OTP tidak valid atau sudah kedaluwarsa", 400);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await User.findOneAndUpdate({ email }, { passwordHash }, { new: true });
  if (!user) return fail("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);

  return ok({ message: "Password berhasil diubah, silakan login." });
}
