import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { verifyOtp } from "@/lib/otp";
import { ok, fail } from "@/lib/response";

const schema = z.object({ medicalRecordNo: z.string(), code: z.string().min(4), newPassword: z.string().min(8) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  const { medicalRecordNo, code, newPassword } = parsed.data;
  await connectDB();

  const patient = await Patient.findOne({ medicalRecordNo });
  if (!patient || !patient.email) return fail("PATIENT_NOT_FOUND", "Pasien tidak ditemukan", 404);

  const result = await verifyOtp(patient.email, "PATIENT_RESET_PASSWORD", code);
  if (!result.ok) return fail(result.reason, "Kode OTP tidak valid atau kedaluwarsa", 400);

  patient.passwordHash = await bcrypt.hash(newPassword, 10);
  await patient.save();

  return ok({ message: "Password berhasil diubah, silakan login." });
}
