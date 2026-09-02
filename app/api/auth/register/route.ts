import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { createOtp } from "@/lib/otp";
import { sendMail, otpEmailTemplate } from "@/lib/mailer";
import { ok, fail } from "@/lib/response";

const schema = z.object({
  clinicName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());
  }

  const { clinicName, name, email, password, phone } = parsed.data;
  await connectDB();

  const existing = await User.findOne({ email });
  if (existing && existing.isEmailVerified) {
    return fail("EMAIL_TAKEN", "Email sudah terdaftar", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.phone = phone || "";
    existing.pendingClinicName = clinicName;
    await existing.save();
  } else {
    await User.create({
      name,
      email,
      passwordHash,
      phone,
      pendingClinicName: clinicName,
      role: "OWNER",
      isEmailVerified: false,
    });
  }

  const { code, expiresInMinutes } = await createOtp(email, "REGISTER");

  try {
    await sendMail(email, "Kode OTP Verifikasi KlinikKita", otpEmailTemplate(name, code, expiresInMinutes));
  } catch (err) {
    return fail(
      "MAIL_ERROR",
      "Gagal mengirim email OTP. Pastikan GMAIL_USER dan GMAIL_APP_PASSWORD sudah diisi.",
      500,
      err instanceof Error ? err.message : undefined
    );
  }

  return ok({ email, message: "Kode OTP telah dikirim ke email Anda." });
}
