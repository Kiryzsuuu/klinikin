import { Schema, model, models } from "mongoose";

const visitSchema = new Schema(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    visitNo: { type: String, required: true, unique: true },
    visitDate: { type: Date, default: Date.now },
    visitType: { type: String, enum: ["RAWAT_JALAN", "RAWAT_INAP", "UGD"], default: "RAWAT_JALAN" },
    paymentType: { type: String, enum: ["UMUM", "BPJS", "ASURANSI"], default: "UMUM" },
    status: { type: String, enum: ["WAITING", "IN_PROGRESS", "DONE", "CANCELLED"], default: "WAITING" },

    subjective: { type: String, default: "" },
    objective: {
      bloodPressure: { type: String, default: "" },
      pulse: { type: Number },
      temperature: { type: Number },
      respiratoryRate: { type: Number },
      weight: { type: Number },
      height: { type: Number },
      physicalExam: { type: String, default: "" },
      // Foto/dokumen medis (hasil scan, foto luka, dsb) — base64 langsung di dokumen
      attachments: [{ type: String }],
    },
    assessment: {
      diagnoses: [
        {
          icdCode: { type: String },
          icdDescription: { type: String },
          type: { type: String, enum: ["PRIMARY", "SECONDARY"], default: "PRIMARY" },
        },
      ],
    },
    plan: {
      medications: [
        {
          medicineName: { type: String },
          dosage: { type: String },
          frequency: { type: String },
          duration: { type: String },
          notes: { type: String },
        },
      ],
      controlDate: { type: Date },
      doctorNotes: { type: String, default: "" },
      // e-Rujukan
      referral: {
        isReferred: { type: Boolean, default: false },
        referralTo: { type: String, default: "" },
        reason: { type: String, default: "" },
      },
    },

    aiSummary: { type: String, default: "" },

    // Odontogram (klinik gigi) — status 32 gigi permanen, dicatat hanya saat relevan
    dentalChart: [
      {
        toothNumber: { type: Number, min: 1, max: 32 },
        status: {
          type: String,
          enum: ["SEHAT", "KARIES", "TAMBAL", "DICABUT", "AKAR", "IMPAKSI"],
          default: "SEHAT",
        },
        note: { type: String, default: "" },
      },
    ],

    // Skin chart (klinik kecantikan) — area kulit + kondisi yang dicatat dokter
    skinChart: [
      {
        area: { type: String, required: true },
        condition: { type: String, default: "" },
        photoBase64: { type: String, default: "" },
      },
    ],

    satuSehatStatus: {
      isSynced: { type: Boolean, default: false },
      encounterResourceId: { type: String, default: "" },
      lastSyncAt: { type: Date },
      syncError: { type: String, default: "" },
    },
    bpjsStatus: {
      noSEP: { type: String, default: "" },
      isSubmitted: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

visitSchema.index({ branchId: 1, visitDate: -1 });
visitSchema.index({ patientId: 1, visitDate: -1 });

export async function generateVisitNo(branchCode: string) {
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const prefix = `${branchCode}-${datePart}-`;
  const VisitModel = models.Visit || model("Visit", visitSchema);
  const count = await VisitModel.countDocuments({ visitNo: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

export const Visit = models.Visit || model("Visit", visitSchema);
