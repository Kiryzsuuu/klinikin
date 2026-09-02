import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getOrCreateSettings, SiteSettings } from "@/models/SiteSettings";
import { getSession } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { isValidBase64Image } from "@/lib/image";
import { audit } from "@/lib/audit";

// SiteSettings adalah konfigurasi platform (landing page KlinikKita), bukan per-klinik —
// hanya SUPER_ADMIN yang boleh mengubahnya, bukan OWNER/ADMIN_PUSAT klinik individual.
const MANAGE_ROLES = ["SUPER_ADMIN"];

const settingsSchema = z.object({
  siteName: z.string().min(1).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  logoBase64: z.string().optional(),
  faviconBase64: z.string().optional(),
  heroImageBase64: z.string().optional(),
  backgroundImageBase64: z.string().optional(),
  theme: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      darkColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      fontFamily: z.string().optional(),
      borderRadius: z.string().optional(),
    })
    .optional(),
  contact: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  socials: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional(),
    })
    .optional(),
  hero: z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
    })
    .optional(),
  features: z
    .object({
      registrationEnabled: z.boolean().optional(),
      maintenanceMode: z.boolean().optional(),
      maintenanceMessage: z.string().optional(),
    })
    .optional(),
});

// Publik: dipakai landing page & layout untuk render tema/branding
export async function GET() {
  await connectDB();
  const settings = await getOrCreateSettings();
  return ok(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return fail("UNAUTHORIZED", "Belum login", 401);
  if (!MANAGE_ROLES.includes(session.role)) return fail("FORBIDDEN", "Akses ditolak", 403);

  const parsed = settingsSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const data = parsed.data;
  for (const key of ["logoBase64", "faviconBase64", "heroImageBase64", "backgroundImageBase64"] as const) {
    const value = data[key];
    if (value && !isValidBase64Image(value)) {
      return fail("INVALID_IMAGE", `Gambar untuk ${key} tidak valid atau > 2MB`, 422);
    }
  }

  await connectDB();
  await getOrCreateSettings();

  const settings = await SiteSettings.findOneAndUpdate(
    { key: "SITE_SETTINGS" },
    { $set: flatten(data) },
    { new: true }
  );

  await audit(session, "SETTINGS_UPDATE", "SiteSettings", "SITE_SETTINGS", req, { fields: Object.keys(data) });
  return ok(settings);
}

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(result, flatten(v as Record<string, unknown>, path));
    } else if (v !== undefined) {
      result[path] = v;
    }
  }
  return result;
}
