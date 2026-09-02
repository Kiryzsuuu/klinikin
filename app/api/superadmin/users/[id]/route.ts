import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User, ROLES } from "@/models/User";
import { Clinic } from "@/models/Clinic";
import { guard, isError } from "@/lib/guard";
import { ok, fail } from "@/lib/response";
import { isValidBase64Image } from "@/lib/image";
import { audit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(ROLES).optional(),
  clinicId: z.string().nullable().optional(),
  phone: z.string().optional(),
  photoBase64: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;
  const { session } = g;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const { photoBase64, password, clinicId, role, ...rest } = parsed.data;

  if (photoBase64 && !isValidBase64Image(photoBase64)) {
    return fail("INVALID_IMAGE", "Format atau ukuran gambar tidak valid (maks 2MB)", 422);
  }

  await connectDB();

  if (clinicId) {
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);
  }

  const update: Record<string, unknown> = { ...rest };
  if (role) update.role = role;
  if (clinicId !== undefined) update.clinicId = role === "SUPER_ADMIN" ? null : clinicId;
  if (photoBase64) update.photoBase64 = photoBase64;
  if (password) update.passwordHash = await bcrypt.hash(password, 10);

  const user = await User.findByIdAndUpdate(id, update, { new: true }).select(
    "-passwordHash -mfaSecret -mfaPendingSecret"
  );
  if (!user) return fail("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);

  await audit(session, "USER_UPDATE", "User", id, req, { fields: Object.keys(update) });
  return ok(user);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;
  const { session } = g;

  const { id } = await params;
  if (id === session.userId) return fail("CANNOT_DELETE_SELF", "Tidak bisa menghapus akun sendiri", 400);

  await connectDB();
  const user = await User.findByIdAndDelete(id);
  if (!user) return fail("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);

  await audit(session, "USER_DELETE", "User", id, req);
  return ok({ message: "Pengguna berhasil dihapus" });
}
