import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { Clinic } from "@/models/Clinic";
import { createOtp } from "@/lib/otp";
import { sendMail, otpEmailTemplate } from "@/lib/mailer";
import { ok, fail } from "@/lib/response";

const schema = z.object({
  clinicSlug: z.string().min(1),
  medicalRecordNo: z.string().min(3),
  phone: z.string().min(6),
  password: z.string().min(8),
});

// Pasien mendaftar akun portal dengan mencocokkan No. RM + telepon yang sudah tercatat
// di klinik (dibuat lewat booking atau kunjungan). Butuh email tersimpan untuk terima OTP.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  const { clinicSlug, medicalRecordNo, phone, password } = parsed.data;
  await connectDB();

  const clinic = await Clinic.findOne({ slug: clinicSlug });
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);

  const patient = await Patient.findOne({ clinicId: clinic._id, medicalRecordNo, phone });
  if (!patient) {
    return fail("PATIENT_NOT_FOUND", "No. RM dan No. Telepon tidak cocok dengan data klinik", 404);
  }
  if (patient.isPortalActive) {
    return fail("ALREADY_REGISTERED", "Akun untuk pasien ini sudah terdaftar, silakan login", 409);
  }
  if (!patient.email) {
    return fail(
      "EMAIL_MISSING",
      "Email belum tercatat di data pasien. Hubungi klinik untuk melengkapi data sebelum mendaftar portal.",
      400
    );
  }

  patient.passwordHash = await bcrypt.hash(password, 10);
  await patient.save();

  const { code, expiresInMinutes } = await createOtp(patient.email, "PATIENT_REGISTER");

  try {
    await sendMail(
      patient.email,
      "Kode OTP Aktivasi Portal Pasien - KlinikKita",
      otpEmailTemplate(patient.name, code, expiresInMinutes)
    );
  } catch (err) {
    return fail("MAIL_ERROR", "Gagal mengirim email OTP", 500, err instanceof Error ? err.message : undefined);
  }

  return ok({ medicalRecordNo, email: patient.email, message: "Kode OTP telah dikirim ke email Anda." });
}
