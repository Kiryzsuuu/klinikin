import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { ApiKey } from "@/models/ApiKey";
import { MANAGE_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";
import { audit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;

  const { id } = await params;
  await connectDB();
  const key = await ApiKey.findOneAndUpdate({ _id: id, ...clinicFilter }, { isActive: false }, { new: true });
  if (!key) return fail("KEY_NOT_FOUND", "API key tidak ditemukan", 404);
  await audit(session, "API_KEY_REVOKE", "ApiKey", id, req);
  return ok({ message: "API key dicabut" });
}
