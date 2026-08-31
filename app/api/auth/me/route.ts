import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth";
import { ok, fail } from "@/lib/response";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("UNAUTHORIZED", "Belum login", 401);

  await connectDB();
  const user = await User.findById(session.userId).select("-passwordHash");
  if (!user) return fail("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);

  return ok({ user });
}
