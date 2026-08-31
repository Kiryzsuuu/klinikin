import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { createOtp } from "@/lib/otp";
import { sendMail, otpEmailTemplate } from "@/lib/mailer";
import { ok } from "@/lib/response";

const schema = z.object({ medicalRecordNo: z.string() });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return ok({ message: "Jika data cocok, kode OTP telah dikirim." });

  await connectDB();
  const patient = await Patient.findOne({ medicalRecordNo: parsed.data.medicalRecordNo, isPortalActive: true });

  if (patient?.email) {
    const { code, expiresInMinutes } = await createOtp(patient.email, "PATIENT_RESET_PASSWORD");
    try {
      await sendMail(patient.email, "Reset Password Portal Pasien", otpEmailTemplate(patient.name, code, expiresInMinutes));
    } catch {
      // jangan bocorkan kegagalan pengiriman
    }
  }

  return ok({ message: "Jika data cocok, kode OTP telah dikirim." });
}
