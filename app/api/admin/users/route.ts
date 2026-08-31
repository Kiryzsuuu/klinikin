import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User, ROLES } from "@/models/User";
import { getSession } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { isValidBase64Image } from "@/lib/image";

const MANAGE_ROLES = ["OWNER", "ADMIN_PUSAT"];

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLES),
  phone: z.string().optional(),
  photoBase64: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return fail("UNAUTHORIZED", "Belum login", 401);
  if (!MANAGE_ROLES.includes(session.role)) return fail("FORBIDDEN", "Akses ditolak", 403);

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 20));
  const q = searchParams.get("q") || "";

  const filter = q
    ? { $or: [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] }
    : {};

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
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
  const session = await getSession();
  if (!session) return fail("UNAUTHORIZED", "Belum login", 401);
  if (!MANAGE_ROLES.includes(session.role)) return fail("FORBIDDEN", "Akses ditolak", 403);

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const { name, email, password, role, phone, photoBase64 } = parsed.data;

  if (photoBase64 && !isValidBase64Image(photoBase64)) {
    return fail("INVALID_IMAGE", "Format atau ukuran gambar tidak valid (maks 2MB)", 422);
  }

  await connectDB();
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
  });

  const result = user.toObject();
  delete result.passwordHash;
  return ok(result, { status: 201 });
}
