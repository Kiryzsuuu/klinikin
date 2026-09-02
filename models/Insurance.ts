import { Schema, model, models } from "mongoose";

// Asuransi swasta bersifat data internal (daftar provider + status klaim manual).
// Setiap asuransi punya portal/API klaim sendiri-sendiri (tidak ada API generik),
// jadi ini melacak status klaim, bukan submit otomatis ke insurer.
const insuranceProviderSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true },
    contactPerson: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    claimPortalUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

insuranceProviderSchema.index({ clinicId: 1, name: 1 }, { unique: true });

export const InsuranceProvider = models.InsuranceProvider || model("InsuranceProvider", insuranceProviderSchema);

const insuranceClaimSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    providerId: { type: Schema.Types.ObjectId, ref: "InsuranceProvider", required: true },
    policyNo: { type: String, default: "" },
    claimAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "PAID"],
      default: "SUBMITTED",
    },
    note: { type: String, default: "" },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const InsuranceClaim = models.InsuranceClaim || model("InsuranceClaim", insuranceClaimSchema);
