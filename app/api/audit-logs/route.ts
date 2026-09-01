import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import { guard, isError, MANAGE_ROLES } from "@/lib/guard";
import { ok } from "@/lib/response";

export async function GET(req: NextRequest) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 30));
  const action = searchParams.get("action");
  const resourceType = searchParams.get("resourceType");

  const filter: Record<string, unknown> = {};
  if (action) filter.action = action;
  if (resourceType) filter.resourceType = resourceType;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return ok(items, { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
