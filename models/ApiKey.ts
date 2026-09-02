import { Schema, model, models } from "mongoose";

// API publik untuk integrasi pihak ketiga — otentikasi via API key (hash tersimpan,
// key asli hanya ditampilkan sekali saat dibuat).
const apiKeySchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true },
    keyHash: { type: String, required: true },
    keyPrefix: { type: String, required: true }, // 8 karakter pertama, untuk identifikasi di UI
    scopes: [{ type: String, enum: ["patients:read", "visits:read", "branches:read"] }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastUsedAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ApiKey = models.ApiKey || model("ApiKey", apiKeySchema);
