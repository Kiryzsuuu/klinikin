import { Schema, model, models } from "mongoose";

// Modul Laboratorium & Radiologi (LIS/RIS) dasar — hasil disimpan sebagai
// teks + file (PDF/gambar) base64, bukan integrasi alat lab fisik.
const labOrderSchema = new Schema(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    visitId: { type: Schema.Types.ObjectId, ref: "Visit" },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    category: { type: String, enum: ["LAB", "RADIOLOGI"], default: "LAB" },
    testName: { type: String, required: true },
    notes: { type: String, default: "" },

    status: { type: String, enum: ["REQUESTED", "PROCESSING", "DONE", "CANCELLED"], default: "REQUESTED" },
    resultText: { type: String, default: "" },
    resultFileBase64: { type: String, default: "" },
    resultFileName: { type: String, default: "" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

labOrderSchema.index({ branchId: 1, createdAt: -1 });
labOrderSchema.index({ patientId: 1, createdAt: -1 });

export const LabOrder = models.LabOrder || model("LabOrder", labOrderSchema);
