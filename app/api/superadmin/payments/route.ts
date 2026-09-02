import { connectDB } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { guard, isError } from "@/lib/guard";
import { ok } from "@/lib/response";

export async function GET() {
  const g = await guard(["SUPER_ADMIN"]);
  if (isError(g)) return g.error;

  await connectDB();
  const payments = await Payment.find({})
    .populate("clinicId", "name slug")
    .populate("planId", "name")
    .sort({ createdAt: -1 })
    .limit(200);
  return ok(payments);
}
