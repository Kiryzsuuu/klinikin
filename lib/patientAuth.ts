import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const PATIENT_SESSION_COOKIE = "klinikkita_patient_session";

export type PatientSessionPayload = { patientId: string; medicalRecordNo: string };

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET belum diisi di .env.local");
  return secret;
}

export function signPatientSession(payload: PatientSessionPayload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "30d" });
}

export function verifyPatientSession(token: string): PatientSessionPayload | null {
  try {
    return jwt.verify(token, getSecret()) as PatientSessionPayload;
  } catch {
    return null;
  }
}

export async function getPatientSession(): Promise<PatientSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PATIENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyPatientSession(token);
}
