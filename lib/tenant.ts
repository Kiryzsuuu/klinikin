import { guard, isError } from "@/lib/guard";
import { fail } from "@/lib/response";
import { Clinic } from "@/models/Clinic";
import type { SessionPayload } from "@/lib/jwt";

export { isError };

// Batasan fitur selama masa TRIAL — dibuka penuh setelah klinik berlangganan (status ACTIVE).
export const TRIAL_LIMITS = {
  maxBranches: 1,
  maxUsers: 3,
  disabledFeatures: new Set([
    "ai",
    "procurement",
    "insurance",
    "whatsapp",
    "export",
    "api-keys",
  ]),
};

type ScopedGuardResult =
  | { session: SessionPayload; clinicFilter: Record<string, unknown> }
  | { error: ReturnType<typeof fail> };

// Bungkus guard() biasa: tambahkan filter klinik untuk dipakai di query.
// SUPER_ADMIN tidak difilter (bisa lihat semua klinik), role lain wajib clinicId cocok.
export async function scopedGuard(allowedRoles: string[]): Promise<ScopedGuardResult> {
  const g = await guard(allowedRoles);
  if (isError(g)) return g;

  const { session } = g;
  const clinicFilter = session.role === "SUPER_ADMIN" ? {} : { clinicId: session.clinicId };
  return { session, clinicFilter };
}

const TRIAL_DAYS = 14;

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Bikin slug unik: kalau "klinik-sehat" sudah dipakai, coba "klinik-sehat-2", dst.
export async function generateUniqueClinicSlug(name: string) {
  const base = slugify(name) || "klinik";
  let slug = base;
  let n = 1;
  while (await Clinic.findOne({ slug })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function createTrialClinic(name: string, ownerEmail: string) {
  const slug = await generateUniqueClinicSlug(name);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  return Clinic.create({
    name,
    slug,
    ownerEmail,
    subscription: { status: "TRIAL", trialEndsAt },
  });
}

// Cek apakah suatu fitur terkunci untuk klinik sesi ini (dipanggil di route yang butuh gating trial).
export async function requireFeature(
  session: SessionPayload,
  feature: string
): Promise<ReturnType<typeof fail> | null> {
  if (session.role === "SUPER_ADMIN") return null;

  const clinic = await Clinic.findById(session.clinicId);
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);

  if (["EXPIRED", "SUSPENDED"].includes(clinic.subscription?.status)) {
    return fail(
      "SUBSCRIPTION_INACTIVE",
      "Langganan klinik tidak aktif. Silakan perbarui langganan di menu Billing.",
      402
    );
  }

  if (clinic.subscription?.status === "TRIAL" && TRIAL_LIMITS.disabledFeatures.has(feature)) {
    return fail(
      "FEATURE_LOCKED",
      "Fitur ini terkunci selama masa trial. Upgrade paket untuk membuka.",
      403
    );
  }

  return null;
}
