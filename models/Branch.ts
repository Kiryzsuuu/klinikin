import { Schema, model, models } from "mongoose";

const branchSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["PRATAMA", "UTAMA", "SPESIALIS"], default: "PRATAMA" },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      province: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },
    contact: {
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    operationalHours: {
      open: { type: String, default: "08:00" },
      close: { type: String, default: "17:00" },
    },
    bpjsInfo: {
      puskesmasCode: { type: String, default: "" },
      pCareUsername: { type: String, default: "" },
    },
    satuSehatInfo: {
      organizationId: { type: String, default: "" },
      locationId: { type: String, default: "" },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Branch = models.Branch || model("Branch", branchSchema);
