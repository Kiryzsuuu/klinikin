import { ok } from "@/lib/response";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = ok({ message: "Berhasil logout" });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
