import { ok } from "@/lib/response";
import { PATIENT_SESSION_COOKIE } from "@/lib/patientAuth";

export async function POST() {
  const res = ok({ message: "Berhasil logout" });
  res.cookies.set(PATIENT_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
