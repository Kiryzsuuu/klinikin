import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { createOtp } from "@/lib/otp";
import { sendMail, otpEmailTemplate } from "@/lib/mailer";
import { ok, fail } from "@/lib/response";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Email tidak valid", 422);

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email });

  // Selalu balas sukses walau email tidak ditemukan (hindari enumerasi akun)
  if (user) {
    const { code, expiresInMinutes } = await createOtp(user.email, "RESET_PASSWORD");
    try {
      await sendMail(
        user.email,
        "Reset Password KlinikHub",
        otpEmailTemplate(user.name, code, expiresInMinutes)
      );
    } catch {
      // diamkan agar tidak membocorkan info; log di server bila perlu
    }
  }

  return ok({ message: "Jika email terdaftar, kode OTP telah dikirim." });
}
