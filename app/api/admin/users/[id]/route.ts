import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User, ROLES } from "@/models/User";
import { getSession } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { isValidBase64Image } from "@/lib/image";
import { audit } from "@/lib/audit";

const MANAGE_ROLES = ["OWNER", "ADMIN_PUSAT"];

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(ROLES).optional(),
  phone: z.string().optional(),
  photoBase64: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return fail("UNAUTHORIZED", "Belum login", 401);
  if (!MANAGE_ROLES.includes(session.role)) return fail("FORBIDDEN", "Akses ditolak", 403);

  const { id } = await params;
  await connectDB();
  const user = await User.findById(id).select("-passwordHash -mfaSecret -mfaPendingSecret");
  if (!user) return fail("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);

  return ok(user);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return fail("UNAUTHORIZED", "Belum login", 401);
  if (!MANAGE_ROLES.includes(session.role)) return fail("FORBIDDEN", "Akses ditolak", 403);

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const { photoBase64, password, ...rest } = parsed.data;

  if (photoBase64 && !isValidBase64Image(photoBase64)) {
    return fail("INVALID_IMAGE", "Format atau ukuran gambar tidak valid (maks 2MB)", 422);
  }

  await connectDB();

  const update: Record<string, unknown> = { ...rest };
  if (photoBase64) update.photoBase64 = photoBase64;
  if (password) update.passwordHash = await bcrypt.hash(password, 10);

  const user = await User.findByIdAndUpdate(id, update, { new: true }).select("-passwordHash -mfaSecret -mfaPendingSecret");
  if (!user) return fail("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);

  await audit(session, "USER_UPDATE", "User", id, req, { fields: Object.keys(update) });
  return ok(user);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return fail("UNAUTHORIZED", "Belum login", 401);
  if (!MANAGE_ROLES.includes(session.role)) return fail("FORBIDDEN", "Akses ditolak", 403);

  const { id } = await params;
  if (id === session.userId) return fail("CANNOT_DELETE_SELF", "Tidak bisa menghapus akun sendiri", 400);

  await connectDB();
  const user = await User.findByIdAndDelete(id);
  if (!user) return fail("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);

  await audit(session, "USER_DELETE", "User", id, req);
  return ok({ message: "Pengguna berhasil dihapus" });
}
