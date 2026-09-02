import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { guard, isError } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";

  const filter: Record<string, unknown> = {};
  if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { slug: { $regex: q, $options: "i" } }];
  if (status) filter["subscription.status"] = status;

  const clinics = await Clinic.find(filter).sort({ createdAt: -1 });
  return ok(clinics);
}

export async function POST(req: NextRequest) {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;

  const body = await req.json();
  if (!body.name || !body.ownerEmail) return fail("VALIDATION_ERROR", "name dan ownerEmail wajib diisi", 422);

  await connectDB();
  const { generateUniqueClinicSlug } = await import("@/lib/tenant");
  const slug = await generateUniqueClinicSlug(body.name);

  const clinic = await Clinic.create({
    name: body.name,
    slug,
    ownerEmail: body.ownerEmail,
    subscription: { status: "TRIAL", trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  });
  return ok(clinic, { status: 201 });
}
