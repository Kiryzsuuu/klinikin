import { Schema, model, models } from "mongoose";

// Singleton: hanya ada satu dokumen settings untuk seluruh situs.
const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: "SITE_SETTINGS", unique: true },

    siteName: { type: String, default: "KlinikHub" },
    tagline: { type: String, default: "Platform Manajemen Klinik Multi-Cabang" },
    description: { type: String, default: "" },

    // Gambar disimpan sebagai base64 data URL, bukan file terpisah.
    logoBase64: { type: String, default: "" },
    faviconBase64: { type: String, default: "" },
    heroImageBase64: { type: String, default: "" },

    theme: {
      primaryColor: { type: String, default: "#57D131" },
      secondaryColor: { type: String, default: "#B9E937" },
      darkColor: { type: String, default: "#406661" },
      backgroundColor: { type: String, default: "#F5F5F5" },
      fontFamily: { type: String, default: "Fredoka One" },
      borderRadius: { type: String, default: "1rem" },
    },

    contact: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    socials: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },

    hero: {
      title: { type: String, default: "Kelola Semua Cabang Klinik dalam Satu Dashboard" },
      subtitle: {
        type: String,
        default: "RME, farmasi, keuangan, dan SDM terintegrasi untuk grup klinik modern.",
      },
      ctaText: { type: String, default: "Mulai Sekarang" },
      ctaLink: { type: String, default: "/register" },
    },

    features: {
      registrationEnabled: { type: Boolean, default: true },
      maintenanceMode: { type: Boolean, default: false },
      maintenanceMessage: { type: String, default: "Situs sedang dalam pemeliharaan." },
    },
  },
  { timestamps: true }
);

export const SiteSettings = models.SiteSettings || model("SiteSettings", siteSettingsSchema);

export async function getOrCreateSettings() {
  let settings = await SiteSettings.findOne({ key: "SITE_SETTINGS" });
  if (!settings) {
    settings = await SiteSettings.create({ key: "SITE_SETTINGS" });
  }
  return settings;
}
