import { Schema, model, models } from "mongoose";

// Checklist akreditasi klinik — item disiapkan manual oleh admin sesuai standar
// akreditasi yang berlaku (mis. standar Kemenkes), bukan diimpor dari sumber resmi.
const accreditationItemSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    category: { type: String, required: true }, // contoh: "Manajemen Klinik", "Keselamatan Pasien"
    item: { type: String, required: true },
    status: { type: String, enum: ["BELUM", "PROSES", "SELESAI"], default: "BELUM" },
    evidenceBase64: { type: String, default: "" },
    evidenceFileName: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

accreditationItemSchema.index({ branchId: 1, category: 1 });

export const AccreditationItem = models.AccreditationItem || model("AccreditationItem", accreditationItemSchema);
