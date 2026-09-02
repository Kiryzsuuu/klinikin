import { z } from "zod";
import { isValidBase64Image } from "@/lib/image";

export const clinicSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  logoBase64: z.string().optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  settings: z
    .object({
      tagline: z.string().optional(),
      description: z.string().optional(),
      heroImageBase64: z.string().optional(),
      theme: z
        .object({
          primaryColor: z.string().optional(),
          secondaryColor: z.string().optional(),
          darkColor: z.string().optional(),
        })
        .optional(),
      hero: z
        .object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          ctaText: z.string().optional(),
        })
        .optional(),
      socials: z
        .object({
          instagram: z.string().optional(),
          facebook: z.string().optional(),
          tiktok: z.string().optional(),
          whatsapp: z.string().optional(),
        })
        .optional(),
      gallery: z.array(z.object({ imageBase64: z.string(), caption: z.string().optional() })).optional(),
    })
    .optional(),
});

export type ClinicSettingsInput = z.infer<typeof clinicSettingsSchema>;

// Validasi semua field gambar (logo, hero, tiap foto galeri) sebelum disimpan.
export function validateClinicImages(data: ClinicSettingsInput): string | null {
  if (data.logoBase64 && !isValidBase64Image(data.logoBase64)) return "Logo tidak valid atau > 2MB";
  if (data.settings?.heroImageBase64 && !isValidBase64Image(data.settings.heroImageBase64)) {
    return "Gambar hero tidak valid atau > 2MB";
  }
  for (const item of data.settings?.gallery ?? []) {
    if (!isValidBase64Image(item.imageBase64)) return "Salah satu foto galeri tidak valid atau > 2MB";
  }
  return null;
}

// Flatten nested object jadi dot-path untuk $set, supaya field yang tidak dikirim tidak ikut ter-reset.
export function flattenSettings(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      result[path] = v;
    } else if (v && typeof v === "object") {
      Object.assign(result, flattenSettings(v as Record<string, unknown>, path));
    } else if (v !== undefined) {
      result[path] = v;
    }
  }
  return result;
}
