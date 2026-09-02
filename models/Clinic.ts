import { Schema, model, models } from "mongoose";

export const SUBSCRIPTION_STATUSES = ["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "SUSPENDED"] as const;

const clinicSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    ownerEmail: { type: String, required: true, lowercase: true, trim: true },
    contact: {
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    logoBase64: { type: String, default: "" },
    isActive: { type: Boolean, default: true },

    // Kustomisasi halaman publik klinik (/c/[slug]) — diatur oleh klinik sendiri
    // (OWNER/ADMIN_PUSAT) atau oleh super admin, TIDAK global lintas klinik.
    settings: {
      tagline: { type: String, default: "Klinik kepercayaan keluarga Anda" },
      description: { type: String, default: "" },
      heroImageBase64: { type: String, default: "" },
      backgroundImageBase64: { type: String, default: "" },
      // Gambar sisi kiri halaman login portal pasien (/c/[slug]/portal/login).
      loginImageBase64: { type: String, default: "" },
      theme: {
        primaryColor: { type: String, default: "#1B686B" },
        secondaryColor: { type: String, default: "#1B686B" },
        darkColor: { type: String, default: "#406661" },
      },
      hero: {
        title: { type: String, default: "" },
        subtitle: { type: String, default: "" },
        ctaText: { type: String, default: "Booking Sekarang" },
      },
      socials: {
        instagram: { type: String, default: "" },
        facebook: { type: String, default: "" },
        tiktok: { type: String, default: "" },
        whatsapp: { type: String, default: "" },
      },
      // Foto promo/event (mis. "Vaksinasi Gratis Bulan Ini") ditampilkan di halaman publik klinik
      gallery: {
        type: [
          {
            imageBase64: { type: String, required: true },
            caption: { type: String, default: "" },
          },
        ],
        default: [],
      },
    },

    subscription: {
      planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", default: null },
      status: { type: String, enum: SUBSCRIPTION_STATUSES, default: "TRIAL" },
      trialEndsAt: { type: Date },
      currentPeriodEnd: { type: Date },
      midtransCustomerId: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const Clinic = models.Clinic || model("Clinic", clinicSchema);
