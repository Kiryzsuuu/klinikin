import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth";
import { verifyTotpToken } from "@/lib/totp";
import { audit } from "@/lib/audit";
import { ok, fail } from "@/lib/response";

const schema = z.object({ code: z.string().min(6).max(6) });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return fail("UNAUTHORIZED", "Belum login", 401);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Kode harus 6 digit", 422);

  await connectDB();
  const user = await User.findById(session.userId);
  if (!user || !user.mfaEnabled) return fail("MFA_NOT_ENABLED", "MFA belum aktif", 400);

  const valid = verifyTotpToken(user.email, user.mfaSecret, parsed.data.code);
  if (!valid) return fail("INVALID_CODE", "Kode tidak valid", 400);

  user.mfaEnabled = false;
  user.mfaSecret = "";
  await user.save();

  await audit(session, "MFA_DISABLE", "User", session.userId, req);
  return ok({ message: "MFA dinonaktifkan" });
}
