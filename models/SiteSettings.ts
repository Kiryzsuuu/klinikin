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
    // Gambar sisi kiri halaman login staf (/login), diatur oleh super admin.
    loginImageBase64: { type: String, default: "" },

    theme: {
      primaryColor: { type: String, default: "#1B686B" },
      secondaryColor: { type: String, default: "#1B686B" },
      darkColor: { type: String, default: "#406661" },
      backgroundColor: { type: String, default: "#F5F5F5" },
      fontFamily: { type: String, default: "Plus Jakarta Sans" },
      borderRadius: { type: String, default: "1rem" },
      // Warna font landing page, bisa diatur berbeda per bagian.
      sections: {
        hero: { type: String, default: "#406661" },
        features: { type: String, default: "#406661" },
        whyUs: { type: String, default: "#406661" },
        stats: { type: String, default: "#406661" },
        pricing: { type: String, default: "#406661" },
        faq: { type: String, default: "#406661" },
        footer: { type: String, default: "#ffffff" },
      },
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

    // Konten FAQ landing page, bisa diatur bebas oleh super admin.
    faqs: {
      type: [
        {
          q: { type: String, required: true },
          a: { type: String, required: true },
        },
      ],
      default: [
        { q: "Apakah butuh kartu kredit untuk mencoba", a: "Tidak. Trial 14 hari langsung aktif begitu klinik selesai mendaftar, tanpa perlu memasukkan data pembayaran." },
        { q: "Bagaimana jika klinik saya punya lebih dari satu cabang", a: "KlinikKita didesain untuk multi-cabang sejak awal. Satu akun klinik bisa mengelola semua cabangnya dari satu dashboard." },
        { q: "Apakah data klinik saya tercampur dengan klinik lain", a: "Tidak. Setiap klinik memiliki data yang terisolasi sepenuhnya, staf dan pasien klinik lain tidak akan pernah terlihat." },
        { q: "Bagaimana cara berlangganan setelah masa trial habis", a: "Pilih paket di halaman Billing pada dashboard admin, pembayaran diproses aman melalui Midtrans." },
      ],
    },
    // "accordion" = ringkas, satu pertanyaan terbuka sekaligus. "grid" = dua kolom, semua terbuka.
    faqLayout: { type: String, enum: ["accordion", "grid"], default: "accordion" },
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
