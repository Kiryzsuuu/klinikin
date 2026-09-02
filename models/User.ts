import { Schema, model, models, type InferSchemaType } from "mongoose";

export const ROLES = [
  "SUPER_ADMIN",
  "OWNER",
  "ADMIN_PUSAT",
  "ADMIN_CABANG",
  "DOKTER",
  "PERAWAT",
  "APOTEKER",
  "KASIR",
] as const;

const userSchema = new Schema(
  {
    // null hanya untuk SUPER_ADMIN (akun platform, lintas klinik)
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", default: null, index: true },
    // Dipakai sementara antara /register (belum verifikasi OTP) dan verify-otp
    // (baru saat itu Clinic benar-benar dibuat, biar tidak ada klinik "sampah" kalau OTP tak pernah diverifikasi)
    pendingClinicName: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "ADMIN_CABANG" },
    // Foto disimpan sebagai base64 data URL langsung di dokumen, bukan file terpisah,
    // sesuai permintaan agar tidak butuh storage eksternal untuk MVP.
    photoBase64: { type: String, default: "" },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },

    // MFA (TOTP) — wajib untuk OWNER & ADMIN_PUSAT sesuai NFR keamanan PRD
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: "" },
    mfaPendingSecret: { type: String, default: "" }, // dipakai selama proses setup, sebelum dikonfirmasi
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User = models.User || model("User", userSchema);
