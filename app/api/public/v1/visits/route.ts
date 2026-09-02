import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Visit } from "@/models/Visit";
import { verifyApiKey } from "@/lib/apiKeyAuth";
import { ok, fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  await connectDB();
  const check = await verifyApiKey(req.headers.get("x-api-key"), "visits:read");
  if (!check.ok) return fail("UNAUTHORIZED", check.message, check.status);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 20));
  const branchId = searchParams.get("branchId");

  const filter: Record<string, unknown> = { clinicId: check.clinicId };
  if (branchId) filter.branchId = branchId;

  const [items, total] = await Promise.all([
    Visit.find(filter)
      .select("visitNo visitDate visitType status branchId")
      .populate("branchId", "name code")
      .skip((page - 1) * limit)
      .limit(limit),
    Visit.countDocuments(filter),
  ]);

  return ok(items, { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
