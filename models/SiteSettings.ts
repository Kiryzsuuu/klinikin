import { Schema, model, models } from "mongoose";

// Singleton: hanya ada satu dokumen settings untuk seluruh situs.
const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: "SITE_SETTINGS", unique: true },

    siteName: { type: String, default: "KlinikKita" },
    tagline: { type: String, default: "Platform SaaS Manajemen Klinik untuk Semua Klinik" },
    description: { type: String, default: "" },

    // Gambar disimpan sebagai base64 data URL, bukan file terpisah.
    logoBase64: { type: String, default: "" },
    faviconBase64: { type: String, default: "" },
    heroImageBase64: { type: String, default: "" },
    backgroundImageBase64: { type: String, default: "" },

    theme: {
      primaryColor: { type: String, default: "#57D131" },
      secondaryColor: { type: String, default: "#9EF40B" },
      darkColor: { type: String, default: "#406661" },
      backgroundColor: { type: String, default: "#F5F5F5" },
      fontFamily: { type: String, default: "Plus Jakarta Sans" },
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
      title: { type: String, default: "Satu Platform untuk Mengelola Klinik Anda" },
      subtitle: {
        type: String,
        default: "RME, farmasi, keuangan, booking online, hingga SDM, semua terintegrasi dalam satu platform. Coba gratis 14 hari, tanpa kartu kredit.",
      },
      ctaText: { type: String, default: "Coba Gratis 14 Hari" },
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
