import { Schema, model, models } from "mongoose";

// Jadwal praktik/shift staf per cabang (HR dasar)
const shiftSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Minggu
    startTime: { type: String, required: true }, // "08:00"
    endTime: { type: String, required: true }, // "16:00"
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

shiftSchema.index({ userId: 1, dayOfWeek: 1 });
shiftSchema.index({ branchId: 1, dayOfWeek: 1 });

export const Shift = models.Shift || model("Shift", shiftSchema);
