import { Schema, model, models } from "mongoose";

export const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED", "EXPIRED"] as const;

const paymentSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    orderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: "PENDING" },
    midtransTransactionId: { type: String, default: "" },
    paidAt: { type: Date },
    rawNotification: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment = models.Payment || model("Payment", paymentSchema);
