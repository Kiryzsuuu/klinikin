import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { Clinic } from "@/models/Clinic";
import { createOtp } from "@/lib/otp";
import { sendMail, otpEmailTemplate } from "@/lib/mailer";
import { ok } from "@/lib/response";

const schema = z.object({ clinicSlug: z.string().min(1), medicalRecordNo: z.string() });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return ok({ message: "Jika data cocok, kode OTP telah dikirim." });

  await connectDB();
  const clinic = await Clinic.findOne({ slug: parsed.data.clinicSlug });
  const patient = clinic
    ? await Patient.findOne({ clinicId: clinic._id, medicalRecordNo: parsed.data.medicalRecordNo, isPortalActive: true })
    : null;

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
