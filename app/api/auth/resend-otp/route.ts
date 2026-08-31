import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { createOtp } from "@/lib/otp";
import { sendMail, otpEmailTemplate } from "@/lib/mailer";
import { ok, fail } from "@/lib/response";

const schema = z.object({
  email: z.string().email(),
  purpose: z.enum(["REGISTER", "LOGIN", "RESET_PASSWORD"]),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  const { email, purpose } = parsed.data;
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) return fail("USER_NOT_FOUND", "Email tidak terdaftar", 404);

  const { code, expiresInMinutes } = await createOtp(email, purpose);

  try {
    await sendMail(email, "Kode OTP KlinikHub", otpEmailTemplate(user.name, code, expiresInMinutes));
  } catch (err) {
    return fail("MAIL_ERROR", "Gagal mengirim email OTP", 500, err instanceof Error ? err.message : undefined);
  }

  return ok({ message: "Kode OTP baru telah dikirim." });
}
