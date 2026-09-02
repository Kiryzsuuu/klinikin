import { Schema, model, models } from "mongoose";

const invoiceSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    visitId: { type: Schema.Types.ObjectId, ref: "Visit" },
    invoiceNo: { type: String, required: true },

    items: [
      {
        type: { type: String, enum: ["CONSULTATION", "MEDICINE", "PROCEDURE", "LAB", "OTHER"] },
        name: String,
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, default: 0 },
        subtotal: { type: Number, default: 0 },
      },
    ],

    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    payment: {
      method: { type: String, enum: ["CASH", "TRANSFER", "QRIS", "BPJS", "INSURANCE"], default: "CASH" },
      status: { type: String, enum: ["UNPAID", "PAID", "PARTIAL", "REFUNDED"], default: "UNPAID" },
      paidAmount: { type: Number, default: 0 },
      paidAt: { type: Date },
    },

    cashierId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

invoiceSchema.index({ branchId: 1, createdAt: -1 });
invoiceSchema.index({ clinicId: 1, invoiceNo: 1 }, { unique: true });

export async function generateInvoiceNo(clinicId: string, branchCode: string) {
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const prefix = `INV-${branchCode}-${datePart}-`;
  const InvoiceModel = models.Invoice || model("Invoice", invoiceSchema);
  const count = await InvoiceModel.countDocuments({ clinicId, invoiceNo: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

export const Invoice = models.Invoice || model("Invoice", invoiceSchema);
