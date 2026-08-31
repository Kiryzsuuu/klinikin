import { Schema, model, models } from "mongoose";

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["REGISTER", "LOGIN", "RESET_PASSWORD", "PATIENT_REGISTER", "PATIENT_RESET_PASSWORD"],
      required: true,
    },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// OTP kedaluwarsa otomatis dihapus MongoDB via TTL index
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = models.Otp || model("Otp", otpSchema);
