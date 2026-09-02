import { Schema, model, models } from "mongoose";

// "Marketplace obat" disederhanakan jadi pencatatan pengadaan internal (supplier +
// purchase order manual), bukan integrasi marketplace/e-procurement pihak ketiga
// nyata, karena tidak ada API generik untuk itu.
const supplierSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true },
    contactPerson: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Supplier = models.Supplier || model("Supplier", supplierSchema);

const purchaseOrderSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    poNo: { type: String, required: true },
    items: [
      {
        medicineName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
      },
    ],
    total: { type: Number, default: 0 },
    status: { type: String, enum: ["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"], default: "DRAFT" },
    orderedBy: { type: Schema.Types.ObjectId, ref: "User" },
    receivedAt: { type: Date },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ clinicId: 1, poNo: 1 }, { unique: true });

export async function generatePoNo(clinicId: string) {
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const prefix = `PO-${datePart}-`;
  const PurchaseOrderModel = models.PurchaseOrder || model("PurchaseOrder", purchaseOrderSchema);
  const count = await PurchaseOrderModel.countDocuments({ clinicId, poNo: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

export const PurchaseOrder = models.PurchaseOrder || model("PurchaseOrder", purchaseOrderSchema);
