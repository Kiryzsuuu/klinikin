import { Schema, model, models } from "mongoose";

// Booking publik dari Patient Portal — belum butuh akun pasien terpisah,
// cukup nama + kontak. Admin/cabang mengonfirmasi lalu mengonversinya jadi Visit.
const bookingSchema = new Schema(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User" },
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    patientEmail: { type: String, default: "" },
    complaint: { type: String, default: "" },
    preferredDate: { type: Date, required: true },
    consultationType: { type: String, enum: ["ONSITE", "ONLINE"], default: "ONSITE" },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "REJECTED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    visitId: { type: Schema.Types.ObjectId, ref: "Visit" },
    callRoomId: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Booking = models.Booking || model("Booking", bookingSchema);
