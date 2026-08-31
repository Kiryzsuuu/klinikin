import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { signPatientSession, PATIENT_SESSION_COOKIE } from "@/lib/patientAuth";
import { ok, fail } from "@/lib/response";

const schema = z.object({ medicalRecordNo: z.string(), password: z.string() });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  const { medicalRecordNo, password } = parsed.data;
  await connectDB();

  const patient = await Patient.findOne({ medicalRecordNo });
  if (!patient || !patient.isPortalActive || !patient.passwordHash) {
    return fail("INVALID_CREDENTIALS", "No. RM atau password salah", 401);
  }

  const validPassword = await bcrypt.compare(password, patient.passwordHash);
  if (!validPassword) return fail("INVALID_CREDENTIALS", "No. RM atau password salah", 401);

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
