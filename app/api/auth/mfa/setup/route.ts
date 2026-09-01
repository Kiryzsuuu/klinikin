import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth";
import { generateTotpSecret, buildQrCodeDataUrl } from "@/lib/totp";
import { ok, fail } from "@/lib/response";

// Mulai proses setup MFA: generate secret baru (belum aktif sampai dikonfirmasi via /enable)
export async function POST() {
  const session = await getSession();
  if (!session) return fail("UNAUTHORIZED", "Belum login", 401);

  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) return fail("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);
  if (user.mfaEnabled) return fail("MFA_ALREADY_ENABLED", "MFA sudah aktif", 400);

  const secret = generateTotpSecret();
  user.mfaPendingSecret = secret;
  await user.save();

  const qrCodeDataUrl = await buildQrCodeDataUrl(user.email, secret);
  return ok({ secret, qrCodeDataUrl });
}
