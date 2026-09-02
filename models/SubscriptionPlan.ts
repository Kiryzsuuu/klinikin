import { Schema, model, models } from "mongoose";

const subscriptionPlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    priceMonthly: { type: Number, required: true, default: 0 },
    maxBranches: { type: Number, default: 1 },
    maxUsers: { type: Number, default: 5 },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SubscriptionPlan = models.SubscriptionPlan || model("SubscriptionPlan", subscriptionPlanSchema);
