import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Otp } from "@/models/Otp";

const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 5);

export function generateOtpCode() {
  const max = 10 ** OTP_LENGTH;
  const code = crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
  return code;
}

export async function createOtp(
  email: string,
  purpose: "REGISTER" | "LOGIN" | "RESET_PASSWORD"
) {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  // Batalkan OTP lama yang belum dipakai untuk email + purpose yang sama
  await Otp.deleteMany({ email, purpose, consumedAt: null });
  await Otp.create({ email, codeHash, purpose, expiresAt });

  return { code, expiresAt, expiresInMinutes: OTP_EXPIRES_MINUTES };
}

export async function verifyOtp(
  email: string,
  purpose: "REGISTER" | "LOGIN" | "RESET_PASSWORD",
  code: string
) {
  const otp = await Otp.findOne({ email, purpose, consumedAt: null }).sort({ createdAt: -1 });

  if (!otp) return { ok: false, reason: "OTP_NOT_FOUND" as const };
  if (otp.expiresAt.getTime() < Date.now()) return { ok: false, reason: "OTP_EXPIRED" as const };
  if (otp.attempts >= 5) return { ok: false, reason: "OTP_LOCKED" as const };

  const isValid = await bcrypt.compare(code, otp.codeHash);
  if (!isValid) {
    otp.attempts += 1;
    await otp.save();
    return { ok: false, reason: "OTP_INVALID" as const };
  }

  otp.consumedAt = new Date();
  await otp.save();
  return { ok: true as const };
}
