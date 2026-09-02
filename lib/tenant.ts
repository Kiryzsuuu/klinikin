import { guard, isError } from "@/lib/guard";
import { fail } from "@/lib/response";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";
import {
  FEATURE_KEY_VALUES,
  TRIAL_DISABLED_FEATURES,
  DEFAULT_ROLE_FEATURES,
  CONFIGURABLE_ROLES,
  type ConfigurableRole,
} from "@/lib/features";
import type { SessionPayload } from "@/lib/jwt";

export { isError };

// Batasan fitur selama masa TRIAL: semua modul non-inti terkunci sampai klinik berlangganan.
export const TRIAL_LIMITS = {
  maxBranches: 1,
  maxUsers: 3,
  disabledFeatures: new Set<string>(TRIAL_DISABLED_FEATURES),
};

const ADMIN_ROLES = new Set(["OWNER", "ADMIN_PUSAT"]);

function isConfigurableRole(role: string): role is ConfigurableRole {
  return (CONFIGURABLE_ROLES as readonly string[]).includes(role);
}

function roleAllowedFeatures(clinic: { rolePermissions?: unknown }, role: string): string[] {
  if (!isConfigurableRole(role)) return [...FEATURE_KEY_VALUES];
  const rolePermissions = clinic.rolePermissions as Record<string, string[]> | undefined;
  return rolePermissions?.[role] ?? DEFAULT_ROLE_FEATURES[role];
}

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

// Cek apakah suatu fitur terkunci untuk sesi ini: dipanggil di setiap route yang mewakili
// satu modul (lihat FEATURE_KEYS). Menggerbang dalam dua lapis independen:
//  1) Paket langganan klinik (trial vs paket ACTIVE, modul inti selalu terbuka)
//  2) Role staf dalam klinik itu (dikustomisasi lewat Clinic.settings.rolePermissions)
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
    // Modul inti (lihat CORE_FEATURES) sengaja tidak pernah ada di TRIAL_LIMITS.disabledFeatures,
    // supaya trial tetap bisa mendemonstrasikan produk inti tanpa perlu paket terpasang dulu.
    if (TRIAL_LIMITS.disabledFeatures.has(feature)) {
      return fail(
        "FEATURE_LOCKED",
        "Fitur ini terkunci selama masa trial. Upgrade paket untuk membuka.",
        403
      );
    }
  } else {
    // Di luar trial, TIDAK ADA modul yang otomatis terbuka: semuanya, termasuk modul inti,
    // mengikuti persis daftar fitur yang dicentang super admin pada paket klinik ini.
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

  if (!ADMIN_ROLES.has(session.role) && (FEATURE_KEY_VALUES as readonly string[]).includes(feature)) {
    const allowed = roleAllowedFeatures(clinic, session.role);
    if (!allowed.includes(feature)) {
      return fail(
        "FEATURE_LOCKED",
        "Fitur ini tidak termasuk akses role Anda. Hubungi admin klinik untuk membuka.",
        403
      );
    }
  }

  return null;
}

// Versi non-guarded dari requireFeature() untuk UI (sidebar dsb): hitung feature key mana saja
// yang terkunci untuk sesi ini supaya tampilan bisa menandai menu terkunci sebelum user klik.
export async function getLockedFeatureKeys(
  clinic: {
    subscription?: { status?: string; planId?: unknown };
    rolePermissions?: unknown;
  } | null,
  role: string
): Promise<string[]> {
  if (!clinic) return [...FEATURE_KEY_VALUES];
  if (role === "SUPER_ADMIN") return [];

  const status = clinic.subscription?.status;
  let planLocked: string[];
  if (status === "TRIAL") {
    planLocked = [...TRIAL_LIMITS.disabledFeatures];
  } else if (status === "EXPIRED" || status === "SUSPENDED") {
    planLocked = [...FEATURE_KEY_VALUES];
  } else {
    const plan = clinic.subscription?.planId
      ? await SubscriptionPlan.findById(clinic.subscription.planId)
      : null;
    planLocked = FEATURE_KEY_VALUES.filter((key) => !(plan?.features.includes(key) ?? false));
  }

  const roleLocked = ADMIN_ROLES.has(role)
    ? []
    : FEATURE_KEY_VALUES.filter((key) => !roleAllowedFeatures(clinic, role).includes(key));

  return [...new Set([...planLocked, ...roleLocked])];
}
