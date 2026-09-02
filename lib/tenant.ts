import { guard, isError } from "@/lib/guard";
import { fail } from "@/lib/response";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";
import { FEATURE_KEY_VALUES } from "@/lib/features";
import type { SessionPayload } from "@/lib/jwt";

export { isError };

// Batasan fitur selama masa TRIAL — semua fitur premium terkunci sampai klinik berlangganan.
export const TRIAL_LIMITS = {
  maxBranches: 1,
  maxUsers: 3,
  disabledFeatures: new Set<string>(FEATURE_KEY_VALUES),
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

  await connectDB();
  const clinic = await Clinic.findById(session.clinicId);
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);

  if (["EXPIRED", "SUSPENDED"].includes(clinic.subscription?.status)) {
    return fail(
      "SUBSCRIPTION_INACTIVE",
      "Langganan klinik tidak aktif. Silakan perbarui langganan di menu Billing.",
      402
    );
  }

  if (clinic.subscription?.status === "TRIAL") {
    if (TRIAL_LIMITS.disabledFeatures.has(feature)) {
      return fail(
        "FEATURE_LOCKED",
        "Fitur ini terkunci selama masa trial. Upgrade paket untuk membuka.",
        403
      );
    }
    return null;
  }

  // Di luar masa trial, fitur premium mengikuti daftar fitur paket yang dipilih klinik —
  // fitur yang bukan bagian dari FEATURE_KEY_VALUES (fitur dasar) selalu terbuka.
  if ((FEATURE_KEY_VALUES as readonly string[]).includes(feature)) {
    const plan = clinic.subscription?.planId
      ? await SubscriptionPlan.findById(clinic.subscription.planId)
      : null;
    if (!plan || !plan.features.includes(feature)) {
      return fail(
        "FEATURE_LOCKED",
        "Fitur ini tidak termasuk paket langganan Anda saat ini. Upgrade paket untuk membuka.",
        403
      );
    }
  }

  return null;
}

// Versi non-guarded dari requireFeature() untuk UI (sidebar dsb): hitung feature key mana saja
// yang terkunci untuk klinik ini supaya tampilan bisa menandai menu terkunci sebelum user klik.
export async function getLockedFeatureKeys(
  clinic: { subscription?: { status?: string; planId?: unknown } } | null
): Promise<string[]> {
  if (!clinic) return [...FEATURE_KEY_VALUES];

  const status = clinic.subscription?.status;
  if (status === "TRIAL") return [...TRIAL_LIMITS.disabledFeatures];
  if (status === "EXPIRED" || status === "SUSPENDED") return [...FEATURE_KEY_VALUES];

  const plan = clinic.subscription?.planId
    ? await SubscriptionPlan.findById(clinic.subscription.planId)
    : null;
  if (!plan) return [...FEATURE_KEY_VALUES];

  return FEATURE_KEY_VALUES.filter((key) => !plan.features.includes(key));
}
