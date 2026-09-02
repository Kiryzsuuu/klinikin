import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Branch } from "@/models/Branch";
import { verifyApiKey } from "@/lib/apiKeyAuth";
import { ok, fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  await connectDB();
  const check = await verifyApiKey(req.headers.get("x-api-key"), "branches:read");
  if (!check.ok) return fail("UNAUTHORIZED", check.message, check.status);

  const branches = await Branch.find({ clinicId: check.clinicId, isActive: true }).select("name code type address contact");
  return ok(branches);
}
