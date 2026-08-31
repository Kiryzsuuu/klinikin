import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { verifyOtp } from "@/lib/otp";
import { signPatientSession, PATIENT_SESSION_COOKIE } from "@/lib/patientAuth";
import { ok, fail } from "@/lib/response";

const schema = z.object({
  medicalRecordNo: z.string(),
  code: z.string().min(4),
  purpose: z.enum(["PATIENT_REGISTER", "PATIENT_RESET_PASSWORD"]),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  const { medicalRecordNo, code, purpose } = parsed.data;
  await connectDB();

  const patient = await Patient.findOne({ medicalRecordNo });
  if (!patient || !patient.email) return fail("PATIENT_NOT_FOUND", "Pasien tidak ditemukan", 404);

  const result = await verifyOtp(patient.email, purpose, code);
  if (!result.ok) return fail(result.reason, "Kode OTP tidak valid atau kedaluwarsa", 400);

  if (purpose === "PATIENT_REGISTER") {
    patient.isPortalActive = true;
    await patient.save();

    const token = signPatientSession({ patientId: patient._id.toString(), medicalRecordNo });
    const res = ok({ patient: { id: String(patient._id), name: patient.name, medicalRecordNo } });
    res.cookies.set(PATIENT_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return ok({ verified: true });
}
