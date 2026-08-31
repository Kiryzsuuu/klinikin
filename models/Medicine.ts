import { Schema, model, models } from "mongoose";

const medicineSchema = new Schema(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    name: { type: String, required: true, trim: true },
    genericName: { type: String, default: "" },
    category: { type: String, default: "" },
    unit: { type: String, default: "tablet" },
    stock: {
      current: { type: Number, default: 0 },
      minimum: { type: Number, default: 10 },
    },
    pricing: {
      buyPrice: { type: Number, default: 0 },
      sellPrice: { type: Number, default: 0 },
    },
    batches: [
      {
        batchNo: String,
        expiredDate: Date,
        quantity: Number,
      },
    ],
  },
  { timestamps: true }
);

medicineSchema.index({ branchId: 1, name: "text" });

export const Medicine = models.Medicine || model("Medicine", medicineSchema);

const stockTransferSchema = new Schema(
  {
    medicineName: { type: String, required: true },
    fromBranchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    toBranchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    quantity: { type: Number, required: true },
    note: { type: String, default: "" },
    transferredBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const StockTransfer = models.StockTransfer || model("StockTransfer", stockTransferSchema);
