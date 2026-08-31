import { Schema, model, models } from "mongoose";

const patientSchema = new Schema(
  {
    medicalRecordNo: { type: String, required: true, unique: true },
    registeredBranchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    name: { type: String, required: true, trim: true },
    nik: { type: String, default: "" },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["L", "P"], default: "L" },
    bloodType: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    allergies: [{ type: String }],
    insurance: {
      type: { type: String, enum: ["UMUM", "BPJS", "ASURANSI_SWASTA"], default: "UMUM" },
      memberNo: { type: String, default: "" },
      provider: { type: String, default: "" },
    },
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relation: { type: String, default: "" },
    },
    photoBase64: { type: String, default: "" },
    isActive: { type: Boolean, default: true },

    // Akun Patient Portal — opsional, pasien yang dibuat lewat booking/RME
    // tidak otomatis punya akun sampai mereka daftar sendiri di /portal/register
    // dan mengonfirmasi via OTP (dicocokkan lewat NIK/No. RM + telepon).
    passwordHash: { type: String, default: "" },
    isPortalActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

patientSchema.index({ name: "text" });

export async function generateMedicalRecordNo() {
  const year = new Date().getFullYear();
  const prefix = `KH-${year}-`;
  const last = await (models.Patient || model("Patient", patientSchema))
    .findOne({ medicalRecordNo: { $regex: `^${prefix}` } })
    .sort({ medicalRecordNo: -1 });

  const lastSeq = last ? Number(last.medicalRecordNo.split("-").pop()) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(6, "0")}`;
}

export const Patient = models.Patient || model("Patient", patientSchema);
