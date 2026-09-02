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

// Manajemen user lintas klinik: hanya SUPER_ADMIN. Beda dari /api/admin/users yang
// otomatis di-scope ke klinik staf yang login.
const createSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(ROLES),
    clinicId: z.string().nullable().optional(),
    phone: z.string().optional(),
    photoBase64: z.string().optional(),
  })
  .refine((d) => d.role === "SUPER_ADMIN" || !!d.clinicId, {
    message: "clinicId wajib diisi untuk role selain SUPER_ADMIN",
    path: ["clinicId"],
  });

export async function GET(req: NextRequest) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 20));
  const q = searchParams.get("q") || "";
  const clinicId = searchParams.get("clinicId") || "";

  const filter: Record<string, unknown> = {};
  if (clinicId) filter.clinicId = clinicId;
  if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash -mfaSecret -mfaPendingSecret")
      .populate("clinicId", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return ok(items, {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;
  const { session } = g;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const { name, email, password, role, clinicId, phone, photoBase64 } = parsed.data;

  if (photoBase64 && !isValidBase64Image(photoBase64)) {
    return fail("INVALID_IMAGE", "Format atau ukuran gambar tidak valid (maks 2MB)", 422);
  }

  await connectDB();

  if (clinicId) {
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);
  }

  const existing = await User.findOne({ email });
  if (existing) return fail("EMAIL_TAKEN", "Email sudah digunakan", 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    phone,
    photoBase64: photoBase64 || "",
    isEmailVerified: true,
    isActive: true,
    clinicId: role === "SUPER_ADMIN" ? null : clinicId,
  });

  const result = user.toObject();
  delete result.passwordHash;
  delete result.mfaSecret;
  delete result.mfaPendingSecret;
  await audit(session, "USER_CREATE", "User", String(user._id), req, { role, clinicId: clinicId || null });
  return ok(result, { status: 201 });
}
